import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./MyReviews.css";
import { FaStar, FaEdit, FaTrash, FaArrowLeft } from "react-icons/fa";

function MyReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingReview, setEditingReview] = useState(null);
  const [editForm, setEditForm] = useState({ rating: 0, comment: "" });
  const navigate = useNavigate();

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const response = await api.get("/reviews/my-reviews", { headers });
      setReviews(response.data);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (review) => {
    setEditingReview(review._id);
    setEditForm({
      rating: review.rating,
      comment: review.comment
    });
  };

  const handleCancelEdit = () => {
    setEditingReview(null);
    setEditForm({ rating: 0, comment: "" });
  };

  const handleUpdate = async (reviewId) => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      
      await api.put(`/reviews/${reviewId}`, editForm, { headers });
      
      // Update local state
      setReviews(reviews.map(review => 
        review._id === reviewId 
          ? { ...review, ...editForm }
          : review
      ));
      
      setEditingReview(null);
      setEditForm({ rating: 0, comment: "" });
      alert("Review updated successfully!");
    } catch (error) {
      console.error("Error updating review:", error);
      alert("Failed to update review. Please try again.");
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      
      await api.delete(`/reviews/${reviewId}`, { headers });
      
      // Remove from local state
      setReviews(reviews.filter(review => review._id !== reviewId));
      
      alert("Review deleted successfully!");
    } catch (error) {
      console.error("Error deleting review:", error);
      alert("Failed to delete review. Please try again.");
    }
  };

  const renderStars = (rating, interactive = false, onRatingChange) => {
    return (
      <div className="stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`star ${star <= rating ? 'filled' : 'empty'} ${interactive ? 'interactive' : ''}`}
            onClick={() => interactive && onRatingChange && onRatingChange(star)}
            disabled={!interactive}
          >
            <FaStar />
          </button>
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return <div className="loading-reviews">Loading your reviews...</div>;
  }

  return (
    <div className="my-reviews-page">
      <div className="reviews-header">
        <button className="back-btn" onClick={() => navigate("/my-orders")}>
          <FaArrowLeft /> Back to Orders
        </button>
        <h2>My Reviews</h2>
        <p>Manage your product reviews and ratings</p>
      </div>

      {reviews.length === 0 ? (
        <div className="no-reviews">
          <div className="no-reviews-icon">📝</div>
          <h3>No Reviews Yet</h3>
          <p>You haven't reviewed any products yet. After making a purchase, you can share your experience!</p>
          <button className="shop-btn" onClick={() => navigate("/customer")}>
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="reviews-list">
          {reviews.map((review) => (
            <div key={review._id} className="review-card">
              <div className="review-product">
                <div className="product-info">
                  <h4>{review.product.name}</h4>
                  <p className="review-date">
                    Reviewed on {formatDate(review.createdAt)}
                  </p>
                  {review.order && (
                    <p className="order-info">
                      Order from {formatDate(review.order.createdAt)}
                    </p>
                  )}
                </div>
              </div>

              <div className="review-content">
                {editingReview === review._id ? (
                  <div className="edit-form">
                    <div className="rating-edit">
                      <label>Rating</label>
                      {renderStars(editForm.rating, true, (rating) => 
                        setEditForm({ ...editForm, rating })
                      )}
                    </div>
                    
                    <div className="comment-edit">
                      <label>Review</label>
                      <textarea
                        value={editForm.comment}
                        onChange={(e) => setEditForm({ ...editForm, comment: e.target.value })}
                        maxLength={500}
                        rows={4}
                      />
                      <small>{editForm.comment.length}/500 characters</small>
                    </div>

                    <div className="edit-actions">
                      <button 
                        className="save-btn" 
                        onClick={() => handleUpdate(review._id)}
                      >
                        Save Changes
                      </button>
                      <button 
                        className="cancel-btn" 
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="review-rating">
                      {renderStars(review.rating)}
                      <span className="rating-text">{review.rating}.0</span>
                    </div>
                    <p className="review-comment">{review.comment}</p>
                    
                    <div className="review-actions">
                      <button 
                        className="edit-btn" 
                        onClick={() => handleEdit(review)}
                      >
                        <FaEdit /> Edit
                      </button>
                      <button 
                        className="delete-btn" 
                        onClick={() => handleDelete(review._id)}
                      >
                        <FaTrash /> Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyReviews;
