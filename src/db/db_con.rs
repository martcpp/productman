use sqlx::{Pool, Postgres, PgPool, Result};
use std::env;
use dotenvy::dotenv;


pub type DatabasePool = Pool<Postgres>;

pub async fn create_pool() -> Result<DatabasePool> {
    dotenv().ok();
    let database_url = env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://username:password@localhost/ecommerce_catalog".to_string());

    let pool = PgPool::connect(&database_url).await?;
    
    Ok(pool)
}
