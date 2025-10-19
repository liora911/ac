"use client";

import React, { useState, useEffect } from "react";

interface Category {
  id: string;
  name: string;
}

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editedCategoryName, setEditedCategoryName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      const data = await response.json();
      setCategories(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!newCategoryName.trim()) {
      setError("Category name cannot be empty.");
      return;
    }

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newCategoryName }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Failed to add category");
      }

      setNewCategoryName("");
      fetchCategories();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!editingCategory || !editedCategoryName.trim()) {
      setError("Category name cannot be empty.");
      return;
    }

    try {
      const response = await fetch(`/api/categories/${editingCategory.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: editedCategoryName }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Failed to update category");
      }

      setEditingCategory(null);
      setEditedCategoryName("");
      fetchCategories();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    setError(null);
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Failed to delete category");
      }

      fetchCategories();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Manage Categories</h2>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <form onSubmit={handleAddCategory} className="mb-8">
        <input
          type="text"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          placeholder="New Category Name"
          className="border p-2 mr-2 rounded"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Add Category
        </button>
      </form>

      <div>
        {categories.map((category) => (
          <div
            key={category.id}
            className="flex justify-between items-center bg-white p-4 rounded shadow mb-2"
          >
            {editingCategory?.id === category.id ? (
              <form onSubmit={handleEditCategory} className="flex-grow">
                <input
                  type="text"
                  value={editedCategoryName}
                  onChange={(e) => setEditedCategoryName(e.target.value)}
                  className="border p-2 mr-2 rounded w-full"
                />
                <button
                  type="submit"
                  className="bg-green-500 text-white px-3 py-1 rounded mr-2"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="bg-gray-500 text-white px-3 py-1 rounded"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <>
                <span className="text-lg">{category.name}</span>
                <div>
                  <button
                    onClick={() => {
                      setEditingCategory(category);
                      setEditedCategoryName(category.name);
                    }}
                    className="bg-yellow-500 text-white px-3 py-1 rounded mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
