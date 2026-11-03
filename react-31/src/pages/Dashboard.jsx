import API_URL from "../utils/api";
import React, { useRef } from "react";
import { Container, Form, Button } from "react-bootstrap";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios"; 
import "./Dashboard.css"; 

export const Dashboard = () => {
  const titleRef = useRef();
  const descRef = useRef();
  const priceRef = useRef();
  const stockRef = useRef();
  const categoryRef = useRef();
  const imagesRef = useRef();
  
  const formRef = useRef();

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const formData = new FormData();
      
      formData.append("title", titleRef.current.value);
      formData.append("description", descRef.current.value);
      formData.append("stock", stockRef.current.value);
      formData.append("price", priceRef.current.value);
      
      formData.append("category", categoryRef.current.value);

      for (let image of imagesRef.current.files) {
        formData.append("images", image);
      }

      const token = localStorage.getItem("token");

     
      const response = await axios.post(`${API_URL}/products`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      formRef.current.reset();
      console.log(response.data);
      toast.success("Product added successfully!");

    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Upload failed..");
    }
  }

  return (
    <div className="dashboard-bg">
      <Toaster position="top-center" reverseOrder={false} />
      <Container className="pt-5">
        <div className="form-card">
          <h2 className="form-title">Create Product</h2> 
          <Form onSubmit={handleSubmit} ref={formRef}>
            
            {/* 1. Product Title */}
            <Form.Group className="mb-4" controlId="productName">
              <Form.Label className="custom-label">Product Title</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="Enter product title" 
                className="custom-input" 
                ref={titleRef} 
              />
            </Form.Group>

            {/* 2. Description */}
            <Form.Group className="mb-4" controlId="productDesc">
              <Form.Label className="custom-label">Description</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={4} 
                placeholder="Enter description" 
                className="custom-input" 
                ref={descRef} 
              />
            </Form.Group>

            {/* 3. Price */}
            <Form.Group className="mb-4" controlId="productPrice">
              <Form.Label className="custom-label">Price</Form.Label>
              <Form.Control 
                type="number" 
                placeholder="0.00" 
                className="custom-input" 
                ref={priceRef} 
              />
            </Form.Group>

            {/* 4. Stock */}
            <Form.Group className="mb-4" controlId="productStock">
              <Form.Label className="custom-label">Product Stock</Form.Label>
              <Form.Control 
                type="number" 
                placeholder="0" 
                className="custom-input" 
                ref={stockRef} 
              />
            </Form.Group>

            {/* 5. Category (UPDATED TO DROPDOWN) */}
            <Form.Group className="mb-4" controlId="productCategory">
              <Form.Label className="custom-label">Product Category</Form.Label>
              <Form.Select 
                className="custom-input" 
                ref={categoryRef}
                defaultValue="main course"
              >
                <option value="breakfast">Breakfast</option>
                <option value="main course">Main Course</option>
                <option value="desserts">Desserts</option>
                <option value="drinks">Drinks</option>
              </Form.Select>
            </Form.Group>

            {/* 6. Images */}
            <Form.Group className="mb-4" controlId="productImages">
              <Form.Label className="custom-label upload-label">Upload Product Images</Form.Label>
              <Form.Control 
                type="file" 
                multiple 
                className="custom-file-input" 
                ref={imagesRef} 
              />
              <Form.Text className="text-muted mt-2 d-block">
                You Can Select Maximum 5 Images
              </Form.Text>
            </Form.Group>
            
            <Button variant="primary" type="submit" className="submit-btn">
              Add Product
            </Button>
          </Form>
        </div>
      </Container>
    </div>
  );
};