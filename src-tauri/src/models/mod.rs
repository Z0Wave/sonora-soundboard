use serde::Serialize;

#[derive(Serialize)]
pub struct AudioDeviceInfo {
    pub name: String,
}

#[derive(Serialize)]
pub struct ProfileItem {
    pub id: String,
    pub name: String,
}

#[derive(Serialize)]
pub struct SoundItem {
    pub id: String,
    pub name: String,
    pub filepath: String,
    pub hotkey_code: Option<String>,
    #[serde(rename = "profileId")]
    pub profile_id: Option<String>,
}
