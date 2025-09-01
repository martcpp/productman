pub mod models;
pub mod db;
pub mod services;
pub mod utils;
pub mod middleware;

use crate::db::db_con::DatabasePool;
use crate::utils::jwt::JwtKeys;
use std::sync::Arc;


#[derive(Clone)]
pub struct AppState {
    pub db_pool: DatabasePool,
    pub jwt_keys: Arc<JwtKeys>,
}