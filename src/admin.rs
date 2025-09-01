use tests3::utils::auth::hash_password;
use tests3::db::db_con::create_pool;
use tests3::db::userq::find_by_email;

#[tokio::main]
async fn main() -> anyhow::Result<()> {

    dotenvy::dotenv().ok();

    // Create database pool
    let db_pool = create_pool().await?;
    tracing::info!("Database connected successfully");

    // Create an admin user
    let admin_username = std::env::var("ADMIN_USERNAME").unwrap_or_else(|_| "adminm".to_string());
    let admin_email = std::env::var("ADMIN_EMAIL").unwrap_or_else(|_| "adminm@example.com".to_string());
    let admin_password = std::env::var("ADMIN_PASSWORD").unwrap_or_else(|_| "adminpassword".to_string());

    let hashed_password = hash_password(&admin_password)?;

    if find_by_email(&db_pool, &admin_email).await?.is_some() {
        return Err(anyhow::anyhow!("Admin user with email {} already exists", admin_email));
    }

    sqlx::query!(
        r#"
        INSERT INTO users (username, email, password_hash, role)
        VALUES ($1, $2, $3, 'admin')
        "#,
        admin_username.trim(),
        admin_email.trim(),
        hashed_password
    )
    .execute(&db_pool)
    .await?;

    println!("Admin user created successfully");
    Ok(())
}