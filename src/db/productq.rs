use crate::db::db_con::DatabasePool;
use crate::models::other::PaginatedResponse;
use crate::models::product::{CreateProduct, Product, ProductWithCategory, UpdateProduct,ProductFilter};
use anyhow::Result;
use uuid::Uuid;
use rust_decimal::Decimal;
use sqlx::{Postgres, QueryBuilder};

pub async fn create_product_db(pool: &DatabasePool, product_data: CreateProduct) -> Result<Product> {
    // Parse price string to Decimal
    let price = Decimal::from_str_exact(&product_data.price).map_err(|_| {
        anyhow::anyhow!("Invalid price format")
    })?;

    let product = sqlx::query_as!(
        Product,
        r#"
        INSERT INTO products (name, description, price, category_id, stock)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name, description, price, category_id, image_url, stock, created_at
        "#,
        product_data.name,
        product_data.description,
        price,
        product_data.category_id,
        product_data.stock
    )
    .fetch_one(pool)
    .await?;

    Ok(product)
}

pub async fn find_product_by_id(pool: &DatabasePool, product_id: Uuid) -> Result<Option<Product>> {
    let product = sqlx::query_as!(
        Product,
        "SELECT id, name, description, price, category_id, image_url, stock, created_at FROM products WHERE id = $1",
        product_id
    )
    .fetch_optional(pool)
    .await?;

    Ok(product)
}

pub async fn find_product_with_category_by_id(
    pool: &DatabasePool,
    product_id: Uuid,
) -> Result<Option<ProductWithCategory>> {
    let product = sqlx::query!(
        r#"
        SELECT 
            p.id, p.name, p.description, p.price, p.category_id, p.image_url, p.stock, p.created_at,
            c.name as category_name
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE p.id = $1
        "#,
        product_id
    )
    .fetch_optional(pool)
    .await.map_err(|_| anyhow::anyhow!("Failed to fetch product"))?;

    Ok(product.map(|row| ProductWithCategory {
        id: row.id,
        name: row.name,
        description: row.description,
        price: row.price,
        category_id: row.category_id,
        category_name: row.category_name,
        image_url: row.image_url,
        stock: row.stock,
        created_at: row.created_at,
    }))
}

pub async fn update_product_db(
    pool: &DatabasePool,
    product_id: Uuid,
    update_data: UpdateProduct,
) -> Result<Product> {
    // Parse price if provided
    let price = if let Some(price_str) = &update_data.price {
        Some(Decimal::from_str_exact(price_str)?)
    } else {
        None
    };

    let product = sqlx::query_as!(
        Product,
        r#"
        UPDATE products
        SET name = COALESCE($2, name),
            description = COALESCE($3, description),
            price = COALESCE($4, price),
            category_id = COALESCE($5, category_id),
            stock = COALESCE($6, stock)
        WHERE id = $1
        RETURNING id, name, description, price, category_id, image_url, stock, created_at
        "#,
        product_id,
        update_data.name,
        update_data.description,
        price,
        update_data.category_id,
        update_data.stock
    )
    .fetch_one(pool)
    .await?;

    Ok(product)
}

pub async fn update_product_image(
    pool: &DatabasePool,
    product_id: Uuid,
    image_url: String,
) -> Result<Product> {
    let product = sqlx::query_as!(
        Product,
        r#"
        UPDATE products
        SET image_url = $2
        WHERE id = $1
        RETURNING id, name, description, price, category_id, image_url, stock, created_at
        "#,
        product_id,
        image_url
    )
    .fetch_one(pool)
    .await?;

    Ok(product)
}

pub async fn delete_product_db(pool: &DatabasePool, product_id: Uuid) -> Result<()> {
    sqlx::query!("DELETE FROM products WHERE id = $1", product_id)
        .execute(pool)
        .await?;

    Ok(())
}

pub async fn search_products(pool: &DatabasePool, filter: &ProductFilter) -> Result<PaginatedResponse<Product>> {
    // Build the WHERE clause conditions
    let mut count_builder: QueryBuilder<'_, Postgres> = QueryBuilder::new("SELECT COUNT(*) FROM products WHERE 1=1");
    let mut product_builder: QueryBuilder<'_, Postgres> = QueryBuilder::new("SELECT * FROM products WHERE 1=1");

    // Apply filters to both builders
    if let Some(search) = &filter.search {
        count_builder.push(" AND to_tsvector('english', name || ' ' || description) @@ plainto_tsquery(")
                     .push_bind(search)
                     .push(")");
        product_builder.push(" AND to_tsvector('english', name || ' ' || description) @@ plainto_tsquery(")
                       .push_bind(search)
                       .push(")");
    }
    if let Some(category) = &filter.category_name {
        count_builder.push(" AND category = ")
                     .push_bind(category);
        product_builder.push(" AND category = ")
                       .push_bind(category);
    }
    if let Some(min_price) = filter.min_price {
        count_builder.push(" AND price >= ")
                     .push_bind(min_price);
        product_builder.push(" AND price >= ")
                       .push_bind(min_price);
    }
    if let Some(max_price) = filter.max_price {
        count_builder.push(" AND price <= ")
                     .push_bind(max_price);
        product_builder.push(" AND price <= ")
                       .push_bind(max_price);
    }
    if let Some(in_stock) = filter.in_stock {
        if in_stock {
            count_builder.push(" AND stock > 0");
            product_builder.push(" AND stock > 0");
        } else {
            count_builder.push(" AND stock = 0");
            product_builder.push(" AND stock = 0");
        }
    }

    // Count total items
    let total_items: (i64,) = count_builder
        .build_query_as()
        .fetch_one(pool)
        .await?;

    // Pagination
    let page = filter.page.unwrap_or(1).max(1);
    let per_page = filter.per_page.unwrap_or(10).min(50);
    let offset = (page - 1) * per_page;
    let total_pages = (total_items.0 as u32 + per_page - 1) / per_page;

    // Fetch paginated items
    let products = product_builder
        .push(" ORDER BY id ASC")
        .push(" LIMIT ").push_bind(per_page as i64)
        .push(" OFFSET ").push_bind(offset as i64)
        .build_query_as::<Product>()
        .fetch_all(pool)
        .await?;

    Ok(PaginatedResponse {
        data: products,
        current_page: page,
        total_items: total_items.0 as u32,
        per_page,
        total_pages,
        item_on_page: None,
    })
}