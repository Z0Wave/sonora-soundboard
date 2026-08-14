use crate::models::AudioDeviceInfo;
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::SampleFormat;
use crossbeam::channel::{Receiver, Sender};
use dashmap::DashMap;
use std::fs::File;
use std::sync::Arc;
use symphonia::core::audio::SampleBuffer;
use symphonia::core::codecs::DecoderOptions;
use symphonia::core::errors::Error;
use symphonia::core::formats::FormatOptions;
use symphonia::core::io::MediaSourceStream;
use symphonia::core::meta::MetadataOptions;
use symphonia::core::probe::Hint;
use uuid::Uuid;

pub fn get_output_devices() -> Result<Vec<AudioDeviceInfo>, String> {
    let host = cpal::default_host();
    let devices = host.output_devices().map_err(|e| e.to_string())?;
    let mut list = Vec::new();
    for device in devices {
        if let Ok(name) = device.name() {
            list.push(AudioDeviceInfo { name });
        }
    }
    Ok(list)
}

pub struct Voice {
    pub id: Uuid,
    pub sample_data: Arc<[f32]>,
    pub position: usize,
    pub volume: f32,
    pub is_playing: bool,
    pub loop_playback: bool,
}

impl Voice {
    #[inline(always)]
    pub fn get_next_sample(&mut self) -> f32 {
        if self.position >= self.sample_data.len() {
            if self.loop_playback {
                self.position = 0;
            } else {
                self.is_playing = false;
                return 0.0;
            }
        }
        let sample = self.sample_data[self.position];
        self.position += 1;
        sample * self.volume
    }
}

pub fn mix_buffer(active_voices: &mut Vec<Voice>, output_buffer: &mut [f32], master_volume: f32) {
    for out_sample in output_buffer.iter_mut() {
        let mut mixed: f32 = 0.0;
        for voice in active_voices.iter_mut().filter(|v| v.is_playing) {
            mixed += voice.get_next_sample();
        }
        mixed *= master_volume;
        let limited = if mixed > 1.0 {
            1.0
        } else if mixed < -1.0 {
            -1.0
        } else {
            mixed - (mixed * mixed * mixed) / 6.0
        };
        *out_sample = limited;
    }
    active_voices.retain(|v| v.is_playing);
}

#[derive(Clone)]
pub enum AudioCommand {
    Play {
        id: Uuid,
        sample: Arc<[f32]>,
        volume: f32,
    },
    Stop(Uuid),
    StopAll,
    SetMasterVolume(f32),
}

pub fn create_audio_queue() -> (Sender<AudioCommand>, Receiver<AudioCommand>) {
    crossbeam::channel::bounded(256)
}

pub fn start_audio_engine(receiver: Receiver<AudioCommand>) -> cpal::Stream {
    let host = cpal::default_host();
    let device = host
        .default_output_device()
        .expect("Nenhum dispositivo de saída de áudio encontrado");
    let config = device
        .default_output_config()
        .expect("Falha ao obter configuração de áudio");
    let mut active_voices: Vec<Voice> = Vec::with_capacity(128);
    let mut master_volume = 1.0;
    let err_fn = |err| eprintln!("Erro na thread de áudio: {}", err);
    let stream_config = config.config();

    let stream = match config.sample_format() {
        SampleFormat::F32 => device.build_output_stream(
            &stream_config,
            move |data: &mut [f32], _: &cpal::OutputCallbackInfo| {
                while let Ok(cmd) = receiver.try_recv() {
                    match cmd {
                        AudioCommand::Play { id, sample, volume } => {
                            active_voices.push(Voice {
                                id,
                                sample_data: sample,
                                position: 0,
                                volume,
                                is_playing: true,
                                loop_playback: false,
                            });
                        }
                        AudioCommand::StopAll => active_voices.clear(),
                        AudioCommand::Stop(id) => {
                            if let Some(voice) = active_voices.iter_mut().find(|v| v.id == id) {
                                voice.is_playing = false;
                            }
                        }
                        AudioCommand::SetMasterVolume(vol) => master_volume = vol,
                    }
                }
                for sample in data.iter_mut() {
                    *sample = 0.0;
                }
                mix_buffer(&mut active_voices, data, master_volume);
            },
            err_fn,
            None,
        ),
        _ => panic!("Formato de áudio não suportado pelo hardware. O sistema exige f32."),
    }
    .unwrap();

    stream.play().unwrap();
    stream
}

pub struct SampleCache {
    pub samples: DashMap<Uuid, Arc<[f32]>>,
    pub target_rate: u32,
    pub target_channels: u16,
}

impl SampleCache {
    pub fn new() -> Self {
        let host = cpal::default_host();
        let device = host.default_output_device().expect("Sem áudio");
        let config = device.default_output_config().expect("Sem config");
        Self {
            samples: DashMap::new(),
            target_rate: config.sample_rate().0,
            target_channels: config.channels(),
        }
    }

    pub fn load_file(&self, id: Uuid, path: &str) -> Result<(), String> {
        let file = Box::new(File::open(path).map_err(|e| format!("Erro ao abrir: {}", e))?);
        let mss = MediaSourceStream::new(file, Default::default());
        let hint = Hint::new();
        let meta_opts: MetadataOptions = Default::default();
        let fmt_opts: FormatOptions = Default::default();
        let dec_opts: DecoderOptions = Default::default();

        let probed = symphonia::default::get_probe()
            .format(&hint, mss, &fmt_opts, &meta_opts)
            .map_err(|e| format!("Formato não suportado: {}", e))?;

        let mut format = probed.format;
        let track = format.default_track().ok_or("Nenhuma faixa encontrada")?;
        let mut decoder = symphonia::default::get_codecs()
            .make(&track.codec_params, &dec_opts)
            .map_err(|e| format!("Falha no decoder: {}", e))?;

        let track_id = track.id;
        let original_rate = track.codec_params.sample_rate.unwrap_or(self.target_rate);
        let original_channels = track
            .codec_params
            .channels
            .map(|c| c.count())
            .unwrap_or(self.target_channels as usize);
        let mut sample_data = Vec::new();

        loop {
            let packet = match format.next_packet() {
                Ok(packet) => packet,
                Err(Error::IoError(_)) => break,
                Err(Error::DecodeError(_)) => continue,
                Err(e) => return Err(e.to_string()),
            };
            if packet.track_id() != track_id {
                continue;
            }
            match decoder.decode(&packet) {
                Ok(audio_buf) => {
                    let mut sample_buf =
                        SampleBuffer::<f32>::new(audio_buf.capacity() as u64, *audio_buf.spec());
                    sample_buf.copy_interleaved_ref(audio_buf);
                    sample_data.extend_from_slice(sample_buf.samples());
                }
                Err(Error::DecodeError(_)) => (),
                Err(_) => break,
            }
        }

        let target_ch = self.target_channels as usize;
        let mut mapped_data =
            Vec::with_capacity((sample_data.len() / original_channels) * target_ch);
        for frame_idx in 0..(sample_data.len() / original_channels) {
            let base_idx = frame_idx * original_channels;
            if original_channels == 1 {
                let sample = sample_data[base_idx];
                for _ in 0..target_ch {
                    mapped_data.push(sample);
                }
            } else {
                for c in 0..target_ch {
                    if c < original_channels {
                        mapped_data.push(sample_data[base_idx + c]);
                    } else {
                        mapped_data.push(0.0);
                    }
                }
            }
        }

        let mut final_data = mapped_data;
        if original_rate != self.target_rate {
            let ratio = original_rate as f64 / self.target_rate as f64;
            let new_frame_count = (final_data.len() as f64 / target_ch as f64 / ratio) as usize;
            let mut resampled = Vec::with_capacity(new_frame_count * target_ch);
            for i in 0..new_frame_count {
                let original_frame_idx = (i as f64 * ratio) as usize;
                let original_sample_idx = original_frame_idx * target_ch;
                for c in 0..target_ch {
                    if original_sample_idx + c < final_data.len() {
                        resampled.push(final_data[original_sample_idx + c]);
                    } else {
                        resampled.push(0.0);
                    }
                }
            }
            final_data = resampled;
        }

        self.samples.insert(id, final_data.into());
        Ok(())
    }
}

pub fn start_secondary_device(
    device_name: &str,
    receiver: Receiver<AudioCommand>,
) -> Result<cpal::Stream, String> {
    let host = cpal::default_host();
    let devices = host.output_devices().map_err(|e| e.to_string())?;
    let device = devices
        .filter_map(|d| {
            if let Ok(name) = d.name() {
                if name == device_name {
                    Some(d)
                } else {
                    None
                }
            } else {
                None
            }
        })
        .next()
        .ok_or("Dispositivo secundário não encontrado")?;

    let config = device.default_output_config().map_err(|e| e.to_string())?;
    let stream_config = config.config();
    let mut active_voices: Vec<Voice> = Vec::with_capacity(128);
    let mut master_volume = 1.0;
    let err_fn = |err| eprintln!("Erro na thread secundária (CABLE): {}", err);

    let stream = match config.sample_format() {
        SampleFormat::F32 => device.build_output_stream(
            &stream_config,
            move |data: &mut [f32], _: &cpal::OutputCallbackInfo| {
                while let Ok(cmd) = receiver.try_recv() {
                    match cmd {
                        AudioCommand::Play { id, sample, volume } => {
                            active_voices.push(Voice {
                                id,
                                sample_data: sample,
                                position: 0,
                                volume,
                                is_playing: true,
                                loop_playback: false,
                            });
                        }
                        AudioCommand::StopAll => active_voices.clear(),
                        AudioCommand::Stop(id) => {
                            if let Some(voice) = active_voices.iter_mut().find(|v| v.id == id) {
                                voice.is_playing = false;
                            }
                        }
                        AudioCommand::SetMasterVolume(vol) => master_volume = vol,
                    }
                }
                for sample in data.iter_mut() {
                    *sample = 0.0;
                }
                mix_buffer(&mut active_voices, data, master_volume);
            },
            err_fn,
            None,
        ),
        _ => return Err("Formato f32 não suportado pelo cabo virtual.".to_string()),
    }
    .map_err(|e| e.to_string())?;

    stream.play().map_err(|e| e.to_string())?;
    Ok(stream)
}

pub fn crop_and_save(
    input_path: &str,
    output_path: &str,
    start_sec: f32,
    end_sec: f32,
    volume_multiplier: f32,
) -> Result<(), String> {
    let file = Box::new(File::open(input_path).map_err(|e| format!("Erro ao abrir: {}", e))?);
    let mss = MediaSourceStream::new(file, Default::default());

    let probed = symphonia::default::get_probe()
        .format(
            &Hint::new(),
            mss,
            &FormatOptions::default(),
            &MetadataOptions::default(),
        )
        .map_err(|e| format!("Formato não suportado: {}", e))?;

    let mut format = probed.format;
    let track = format.default_track().ok_or("Nenhuma faixa encontrada")?;
    let mut decoder = symphonia::default::get_codecs()
        .make(&track.codec_params, &DecoderOptions::default())
        .map_err(|e| format!("Falha no decoder: {}", e))?;

    let track_id = track.id;
    let sample_rate = track.codec_params.sample_rate.unwrap_or(44100);
    let channels = track.codec_params.channels.map(|c| c.count()).unwrap_or(2) as u16;

    let duration = (end_sec - start_sec).clamp(0.1, 10.0);
    let start_frame = (start_sec * sample_rate as f32) as usize;
    let max_frames = (duration * sample_rate as f32) as usize;
    let end_frame = start_frame + max_frames;

    let mut current_frame = 0;
    let mut cropped_samples = Vec::new();

    loop {
        let packet = match format.next_packet() {
            Ok(packet) => packet,
            Err(Error::IoError(_)) => break,
            Err(Error::DecodeError(_)) => continue,
            Err(_) => break,
        };
        if packet.track_id() != track_id {
            continue;
        }
        match decoder.decode(&packet) {
            Ok(audio_buf) => {
                let frames_in_buf = audio_buf.frames();
                let mut sample_buf =
                    SampleBuffer::<f32>::new(audio_buf.capacity() as u64, *audio_buf.spec());
                sample_buf.copy_interleaved_ref(audio_buf);
                let raw_samples = sample_buf.samples();

                for f in 0..frames_in_buf {
                    if current_frame >= start_frame && current_frame < end_frame {
                        let base_idx = f * channels as usize;
                        for c in 0..channels as usize {
                            let sample = raw_samples[base_idx + c] * volume_multiplier;
                            cropped_samples.push(sample.clamp(-1.0, 1.0));
                        }
                    }
                    current_frame += 1;
                }
                if current_frame >= end_frame {
                    break;
                }
            }
            Err(Error::DecodeError(_)) => (),
            Err(_) => break,
        }
    }

    let spec = hound::WavSpec {
        channels,
        sample_rate,
        bits_per_sample: 32,
        sample_format: hound::SampleFormat::Float,
    };
    let mut writer = hound::WavWriter::create(output_path, spec)
        .map_err(|e| format!("Erro ao criar WAV: {}", e))?;
    for sample in cropped_samples {
        writer
            .write_sample(sample)
            .map_err(|e| format!("Erro ao escrever sample: {}", e))?;
    }
    writer
        .finalize()
        .map_err(|e| format!("Erro ao finalizar WAV: {}", e))?;

    Ok(())
}
