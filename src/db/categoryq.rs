use crate::db::db_con::DatabasePool;
use crate::models::category::{Category, CreateCategory,UpdateCategory};
use uuid::Uuid;
use sqlx::Result;

pub async fn create_category_db(pool: &DatabasePool, category_data: CreateCategory) -> Result<Category> {
        let category = sqlx::query_as!(
            Category,
            r#"
            INSERT INTO categories (name, description)
            VALUES ($1, $2)
            RETURNING id, name, description
            "#,
            category_data.name,
            category_data.description
        )
        .fetch_one(pool)
        .await?;

        Ok(category)
    }

    pub async fn find_all_categories(pool: &DatabasePool) -> Result<Vec<Category>> {
        let categories = sqlx::query_as!(
            Category,
            "SELECT id, name, description FROM categories ORDER BY name"
        )
        .fetch_all(pool)
        .await?;

        Ok(categories)
    }

    pub async fn find_category_by_id(pool: &DatabasePool, category_id: Uuid) -> Result<Option<Category>> {
        let category = sqlx::query_as!(
            Category,
            "SELECT id, name, description FROM categories WHERE id = $1",
            category_id
        )
        .fetch_optional(pool)
        .await?;

        Ok(category)
    }

    pub async fn update_category_db(pool: &DatabasePool, category_id: Uuid, data: UpdateCategory) -> Result<Category> {
        let category = sqlx::query_as!(
            Category,
            r#"
            UPDATE categories
            SET name = COALESCE($2, name),
                description = COALESCE($3, description)
            WHERE id = $1
            RETURNING id, name, description
            "#,
            category_id,
            data.name,
            data.description
        )
        .fetch_one(pool)
        .await?;

        Ok(category)
    }

    pub async fn delete_category_db(pool: &DatabasePool, category_id: Uuid) -> Result<()> {
        sqlx::query!(
            "DELETE FROM categories WHERE id = $1",
            category_id
        )
        .execute(pool)
        .await?;

        Ok(())
    }