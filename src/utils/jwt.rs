use anyhow::{anyhow,Result};
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use uuid::Uuid;
use dotenvy::dotenv;
use crate::{models::user::UserRole, utils::error::{AppError, AppResult}};
use chrono::{Utc,Duration};
use crate::models::auth::Claims;


// JWT configuration
const ACCESS_TOKEN_DURATION: i64 = 30; // 30 minutes
const REFRESH_TOKEN_DURATION: i64 = 7; // 7 days
const JWT_SECRET: &str = "your-secret-key-change-this-in-production";

pub struct JwtKeys {
    encoding: EncodingKey,
    decoding: DecodingKey,
}

impl JwtKeys {
    pub fn new(secret: &str) -> Self {
        Self {
            encoding: EncodingKey::from_secret(secret.as_bytes()),
            decoding: DecodingKey::from_secret(secret.as_bytes()),
        }
    }

    pub fn from_env() -> Self {
        dotenv().ok();
        let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| JWT_SECRET.to_string());
        Self::new(&secret)
    }
}


// JWT token functions
pub fn create_access_token(user_id: Uuid, username: &String, role: UserRole, keys: &JwtKeys) -> Result<String> {
    let now = Utc::now();
    let access_token_duration = std::env::var("ACCESS_TOKEN_DURATION").unwrap_or_else(|_| ACCESS_TOKEN_DURATION.to_string());
    let expires_at = now + Duration::minutes(access_token_duration.parse::<i64>().unwrap());

    let claims = Claims {
        sub: user_id.to_string(),
        username:username.to_string(),
        role:role,
        exp: expires_at.timestamp() as usize,
        iat: now.timestamp() as usize,
    };

    let encoded = encode(&Header::default(), &claims, &keys.encoding)
        .map_err(|e| anyhow!("Failed to create access token: {}", e)).unwrap();

    Ok(encoded)
}


pub fn verify_access_token(token: &str, keys: &JwtKeys) -> AppResult<Claims> {
    let mut validation = Validation::new(Algorithm::HS256);
    validation.validate_exp = true;

    let token_data = decode::<Claims>(token, &keys.decoding, &validation)
        .map_err(|_| AppError::invalid_token())?;

    Ok(token_data.claims)
}


pub fn generate_refresh_token() -> String {
    Uuid::new_v4().to_string()
}

pub fn get_access_token_duration() -> i64 {
    dotenv().ok();
    let access_token_duration = std::env::var("ACCESS_TOKEN_DURATION").unwrap_or_else(|_| ACCESS_TOKEN_DURATION.to_string());
    access_token_duration.parse::<i64>().unwrap() * 60 // Return in seconds
}

pub fn get_refresh_token_duration() -> i64 {
    dotenv().ok();
    let refresh_token_duration = std::env::var("REFRESH_TOKEN_DURATION").unwrap_or_else(|_| REFRESH_TOKEN_DURATION.to_string());
    refresh_token_duration.parse::<i64>().unwrap() // Return in seconds
}

// Extract token from Authorization header
pub fn extract_token_from_header(auth_header: &str) -> Option<&str> {
    if auth_header.starts_with("Bearer ") {
        Some(&auth_header[7..])
    } else {
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_jwt_tokens() {
        let keys = JwtKeys::new("test_secret");
        let user_id = Uuid::new_v4();
        let username = "testuser".to_string();
        let role = UserRole::User;

        let token = create_access_token(user_id, &username, role.clone(), &keys).unwrap();
        let claims = verify_access_token(&token, &keys).unwrap();

        assert_eq!(claims.sub, user_id.to_string());
        assert_eq!(claims.username, username);
        assert!(matches!(claims.role, UserRole::User));
    }

    #[test]
    fn test_extract_token_from_header() {
        let header = "Bearer abc123xyz";
        assert_eq!(extract_token_from_header(header), Some("abc123xyz"));

        let invalid_header = "Basic abc123xyz";
        assert_eq!(extract_token_from_header(invalid_header), None);
    }
}