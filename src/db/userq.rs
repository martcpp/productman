use sqlx::Result;
use crate::db::db_con::DatabasePool;
use crate::models::user::{User, CreateUser, UserRole};
use uuid::Uuid;

pub async fn create_user(pool: &DatabasePool, user_data: CreateUser, password_hash: String) -> Result<User> {
        let user = sqlx::query_as!(
            User,
            r#"
            INSERT INTO users (username, email, password_hash, role)
            VALUES ($1, $2, $3, $4)
            RETURNING id, username, email, password_hash, role as "role: UserRole", created_at
            "#,
            user_data.username,
            user_data.email,
            password_hash,
            UserRole::User as UserRole
        )
        .fetch_one(pool)
        .await?;

        Ok(user)
}

pub async fn find_by_email(pool: &DatabasePool, email: &str) -> Result<Option<User>> {
        let user = sqlx::query_as!(
            User,
            r#"
            SELECT id, username, email, password_hash, role as "role: UserRole", created_at
            FROM users
            WHERE email = $1
            "#,
            email
        )
        .fetch_optional(pool)
        .await?;

        Ok(user)
}

pub async fn find_by_id(pool: &DatabasePool, user_id: Uuid) -> Result<Option<User>> {
        let user = sqlx::query_as!(
            User,
            r#"
            SELECT id, username, email, password_hash, role as "role: UserRole", created_at
            FROM users
            WHERE id = $1
            "#,
            user_id
        )
        .fetch_optional(pool)
        .await?;

        Ok(user)
}

    pub async fn update_user(pool: &DatabasePool, user_id: Uuid, username: Option<String>, email: Option<String>) -> Result<User> {
        let user = sqlx::query_as!(
            User,
            r#"
            UPDATE users
            SET username = COALESCE($2, username),
                email = COALESCE($3, email)
            WHERE id = $1
            RETURNING id, username, email, password_hash, role as "role: UserRole", created_at
            "#,
            user_id,
            username,
            email
        )
        .fetch_one(pool)
        .await?;

        Ok(user)
}

pub async fn delete_user(pool: &DatabasePool, user_id: Uuid) -> Result<()> {
        sqlx::query!(
            "DELETE FROM users WHERE id = $1",
            user_id
        )
        .execute(pool)
        .await?;

        Ok(())
}

