use crate::infrastructure::audio::{AudioCommand, SampleCache};
use crossbeam::channel::Sender;
use std::sync::{mpsc, Arc, Mutex};

pub struct AudioState {
    pub sender: Sender<AudioCommand>,
    pub cache: Arc<SampleCache>,
    pub secondary_sender: Sender<AudioCommand>,
    pub device_tx: Mutex<mpsc::Sender<String>>,
}
