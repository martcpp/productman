use argon2::{Argon2, PasswordHasher, PasswordVerifier, Params};
use argon2::password_hash::{SaltString, PasswordHash};
use rand::rngs::OsRng; 
use crate::utils::error::{AppError, AppResult};



fn create_argon2() -> Argon2<'static> {
    let params = Params::new(
        65536,  // memory cost (64 MB)
        3,      // time cost (iterations)  
        4,      // parallelism (threads)
        None    // output length (uses default)
    ).unwrap();
    
    Argon2::new(
        argon2::Algorithm::Argon2id,  // Most secure variant
        argon2::Version::V0x13,       // Latest version
        params                        // Custom parameters
    )
}
// Password hashing functions
pub fn hash_password(password: &str) -> AppResult<String> {
    if password.is_empty() {
        return Err(AppError::invalid_credentials());
    }
    
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = create_argon2();
    let hash = argon2.hash_password(password.as_bytes(), &salt)
    .map_err(|e| anyhow::anyhow!("Failed to hash password: {}", e))?;
    Ok(hash.to_string())
}

pub fn verify_password(password: &str, hash: &str) -> AppResult<bool> {
    if password.is_empty() || hash.is_empty() {
        return Err(AppError::invalid_credentials());
    }

    let parsed_hash = PasswordHash::new(hash).map_err(|_| AppError::invalid_credentials())?;
    let argon2 = create_argon2();
    Ok(argon2.verify_password(password.as_bytes(), &parsed_hash).is_ok())
}


#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_password_hashing() {
        let password = "test_password_123";
        let hash = hash_password(password).unwrap();
        
        assert!(verify_password(password, &hash).unwrap());
        assert!(!verify_password("wrong_password", &hash).unwrap());
    }
}