use tests3::db::db_con::{create_pool};
use tests3::services::{auth,profile,categories,products};
use tests3::middleware::auth::{auth_required, admin_required};
use tests3::utils::jwt::JwtKeys;
use axum::{
    extract::DefaultBodyLimit,
    http::Method,
    middleware,
    routing::{get, post, put, delete},
    Router,
};
use std::sync::Arc;
use tower::ServiceBuilder;
use tower_http::{
    cors::{Any, CorsLayer},
    services::ServeDir,
    trace::TraceLayer,
};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use tests3::AppState;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "ecommerce_catalog=debug,tower_http=debug,axum::rejection=trace".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Load environment variables
    dotenvy::dotenv().ok();

    // Create database pool
    let db_pool = create_pool().await?;
    tracing::info!("Database connected successfully");

    // Create JWT keys
    let jwt_keys = Arc::new(JwtKeys::from_env());

    let state = AppState {
        db_pool,
        jwt_keys,
    };
    
    // Create uploads directory if it doesn't exist
    std::fs::create_dir_all("uploads").unwrap_or_else(|_| {
        tracing::warn!("Failed to create uploads directory");
    });

    // Create auth routes (no middleware)
    let auth_routes = Router::new()
        .route("/api/auth/register", post(auth::register))
        .route("/api/auth/login", post(auth::login))
        .route("/api/auth/refresh", post(auth::refresh_token))
        .route("/api/auth/logout", post(auth::logout));

    // Create protected user routes (with auth middleware)
    let protected_user_routes = Router::new()
        .route("/api/profile", get(profile::get_profile))
        .route("/api/profile", put(profile::update_profile))
        .route_layer(middleware::from_fn_with_state(state.clone(), auth_required));

    // Create public routes (no middleware)
    let public_routes = Router::new()
        .route("/api/products", get(products::list_products))
        .route("/api/products/:id", get(products::get_product))
        .route("/api/categories", get(categories::list_categories))
        .route("/api/categories/:id", get(categories::get_category));

    // Create admin routes (with admin middleware)
    let admin_routes = Router::new()
        .route("/api/products", post(products::create_product))
        .route("/api/products/:id", put(products::update_product))
        .route("/api/products/:id", delete(products::delete_product))
        .route("/api/products/:id/upload-image", post(products::upload_image))
        .route("/api/categories", post(categories::create_category))
        .route("/api/categories/:id", put(categories::update_category))
        .route("/api/categories/:id", delete(categories::delete_category))
        .route_layer(middleware::from_fn_with_state(state.clone(), admin_required));

    // Combine all routes
    let app = Router::new()
        .merge(auth_routes)           // No middleware
        .merge(protected_user_routes) // Auth middleware
        .merge(public_routes)         // No middleware  
        .merge(admin_routes)          // Admin middleware
        
        // Static file serving for uploaded images
        .nest_service("/uploads", ServeDir::new("uploads"))
        
        // Health check
        .route("/health", get(health_check))
        
        // Add shared state
        .with_state(state.clone())
        
        // Add global middleware
        .layer(
            ServiceBuilder::new()
                .layer(TraceLayer::new_for_http())
                .layer(
                    CorsLayer::new()
                        .allow_origin(Any)
                        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
                        .allow_headers(Any),
                )
                .layer(DefaultBodyLimit::max(10 * 1024 * 1024)) // 10MB max file size
        );

    // Start server
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await?;
    tracing::info!("Server starting on http://0.0.0.0:3000");

    axum::serve(listener, app).await?;

    Ok(())
}

async fn health_check() -> &'static str {
    "OK"
}