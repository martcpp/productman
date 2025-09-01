use reqwest::Client;
use serde_json::json;

const BASE_URL: &str = "http://localhost:3000";

#[tokio::test]
async fn test_health_check() {
    let client = Client::new();
    let response = client
        .get(&format!("{}/health", BASE_URL))
        .send()
        .await
        .expect("Failed to send request");
    
    assert!(response.status().is_success());
}

#[tokio::test]
async fn test_get_categories() {
    let client = Client::new();
    
    let response = client
        .get(&format!("{}/api/categories", BASE_URL))
        .send()
        .await
        .expect("Failed to send request");
    
    assert!(response.status().is_success());
    
    let body: serde_json::Value = response.json().await.expect("Failed to parse JSON");
    assert!(body.is_array());
}

#[tokio::test]
async fn test_get_products() {
    let client = Client::new();
    
    let response = client
        .get(&format!("{}/api/products", BASE_URL))
        .send()
        .await
        .expect("Failed to send request");
    
    assert!(response.status().is_success());
    
    let body: serde_json::Value = response.json().await.expect("Failed to parse JSON");
    assert!(body["data"].is_array());
    assert!(body["pagination"].is_object());
}

#[tokio::test]
async fn test_products_with_pagination() {
    let client = Client::new();
    
    let response = client
        .get(&format!("{}/api/products?page=1&limit=5", BASE_URL))
        .send()
        .await
        .expect("Failed to send request");
    
    assert!(response.status().is_success());
    
    let body: serde_json::Value = response.json().await.expect("Failed to parse JSON");
    assert!(body["data"].is_array());
    assert!(body["pagination"]["page"].as_u64().unwrap() == 1);
    assert!(body["pagination"]["limit"].as_u64().unwrap() == 5);
}

#[tokio::test]
async fn test_products_search() {
    let client = Client::new();
    
    let response = client
        .get(&format!("{}/api/products?search=test", BASE_URL))
        .send()
        .await
        .expect("Failed to send request");
    
    assert!(response.status().is_success());
    
    let body: serde_json::Value = response.json().await.expect("Failed to parse JSON");
    assert!(body["data"].is_array());
}

// #[tokio::test]
// async fn test_invalid_login_returns_error() {
//     let client = Client::new();
//     let invalid_data = json!({
//         "email": "nonexistent@example.com",
//         "password": "wrongpassword"
//     });
    
//     let response = client
//         .post(&format!("{}/api/auth/login", BASE_URL))
//         .json(&invalid_data)
//         .send()
//         .await
//         .expect("Failed to send request");
    
//     // Should return 401 or 400 for invalid credentials
//     assert!(response.status().is_client_error());
// }

