use uuid::Uuid;
use time::{OffsetDateTime, Duration};
use sqlx::Result;
use crate::models::auth::RefreshToken;
use crate::db::db_con::DatabasePool;

/// Create a new refresh token
pub async fn create_refresh_token(
        pool: &DatabasePool,
        user_id: Uuid,
        token: &String,
        expires_in_days: i64,
    ) -> Result<RefreshToken> {
        //let pool: DatabasePool = create_pool().await.unwrap();
        let expires_at = OffsetDateTime::now_utc() + Duration::days(expires_in_days);

        let refresh_token = sqlx::query_as!(
            RefreshToken,
            r#"
            INSERT INTO refresh_tokens (user_id, token, expires_at)
            VALUES ($1, $2, $3)
            RETURNING id, user_id, token, expires_at, created_at
            "#,
            user_id,
            token,
            expires_at
        )
        .fetch_one(pool)
        .await.expect("Failed to create refresh token");

        Ok(refresh_token)
    }

    /// Find a refresh token by its token string
    pub async fn find_refresh_token(pool: &DatabasePool, token: &str) -> Result<Option<RefreshToken>> {
        let refresh_token = sqlx::query_as!(
            RefreshToken,
            r#"
            SELECT id, user_id, token, expires_at, created_at
            FROM refresh_tokens
            WHERE token = $1 AND expires_at > NOW()
            "#,
            token
        )
        .fetch_optional(pool)
        .await?;

        Ok(refresh_token)
    }

    /// Delete a refresh token by its token string
    pub async fn delete_refresh_token(pool: &DatabasePool, token: &str) -> Result<()> {
        sqlx::query!(
            "DELETE FROM refresh_tokens WHERE token = $1",
            token
        )
        .execute(pool)
        .await?;

        Ok(())
    }

    /// Delete all refresh tokens for a user
    pub async fn delete_user_refresh_tokens(pool: &DatabasePool, user_id: Uuid) -> Result<()> {
        sqlx::query!(
            "DELETE FROM refresh_tokens WHERE user_id = $1",
            user_id
        )
        .execute(pool)
        .await?;

        Ok(())
    }