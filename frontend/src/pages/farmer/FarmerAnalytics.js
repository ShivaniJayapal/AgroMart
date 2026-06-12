import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import api from '../../services/api';
import './FarmerAnalytics.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

function FarmerAnalytics() {
  const [analyticsData, setAnalyticsData] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    averageOrderValue: 0,
    monthlyRevenue: [],
    productSales: [],
    categoryDistribution: [],
    orderStatus: {},
    recentOrders: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30days');

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const headers = { Authorization: `Bearer ${token}` };
        
        // Fetch farmer's data
        const [productsRes, ordersRes] = await Promise.all([
          api.get('/products/my', { headers }),
          api.get('/orders/received', { headers })
        ]);

        const products = productsRes.data || [];
        const orders = ordersRes.data || [];

        // Calculate analytics
        const analytics = calculateAnalytics(products, orders, timeRange);
        setAnalyticsData(analytics);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [timeRange]);

  const calculateAnalytics = (products, orders, timeRange) => {
    const filteredOrders = filterOrdersByTimeRange(orders, timeRange);
    const paidOrders = filteredOrders.filter(order => order.paymentStatus === 'paid');
    const totalRevenue = paidOrders.reduce((sum, order) => sum + order.amount, 0);
    const totalOrders = paidOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate monthly revenue
    const monthlyRevenue = calculateMonthlyRevenue(paidOrders);
    
    // Calculate product sales
    const productSales = calculateProductSales(paidOrders);
    
    // Calculate category distribution
    const categoryDistribution = calculateCategoryDistribution(products);
    
    // Calculate order status distribution
    const orderStatus = calculateOrderStatus(filteredOrders);
    
    // Get recent orders sorted by newest first
    const recentOrders = filteredOrders
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    return {
      totalRevenue,
      totalOrders,
      totalProducts: products.length,
      averageOrderValue,
      monthlyRevenue,
      productSales,
      categoryDistribution,
      orderStatus,
      recentOrders
    };
  };

  const filterOrdersByTimeRange = (orders, range) => {
    if (!range || range === 'all') return orders;

    const now = new Date();
    const cutoff = new Date(now);

    switch (range) {
      case '7days':
        cutoff.setDate(now.getDate() - 7);
        break;
      case '30days':
        cutoff.setDate(now.getDate() - 30);
        break;
      case '90days':
        cutoff.setDate(now.getDate() - 90);
        break;
      case '1year':
        cutoff.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return orders;
    }

    return orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= cutoff && orderDate <= now;
    });
  };

  const calculateMonthlyRevenue = (orders) => {
    const monthlyData = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize with 0
    months.forEach(month => {
      monthlyData[month] = 0;
    });

    orders.forEach(order => {
      const date = new Date(order.createdAt);
      const month = months[date.getMonth()];
      monthlyData[month] += order.amount;
    });

    return months.map(month => monthlyData[month]);
  };

  const calculateProductSales = (orders) => {
    const productSales = {};
    
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!productSales[item.name]) {
          productSales[item.name] = 0;
        }
        productSales[item.name] += item.quantity;
      });
    });

    return Object.entries(productSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, quantity]) => ({ name, quantity }));
  };

  const calculateCategoryDistribution = (products) => {
    const categories = {};
    
    products.forEach(product => {
      const category = product.category || 'Other';
      if (!categories[category]) {
        categories[category] = 0;
      }
      categories[category] += 1;
    });

    return Object.entries(categories).map(([name, count]) => ({ name, count }));
  };

  const calculateOrderStatus = (orders) => {
    const status = {
      placed: 0,
      shipped: 0,
      in_transit: 0,
      delivered: 0
    };

    orders.forEach(order => {
      if (status.hasOwnProperty(order.status)) {
        status[order.status]++;
      }
    });

    return status;
  };

  // Chart configurations
  const monthlyRevenueChart = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Monthly Revenue (Rs)',
        data: analyticsData.monthlyRevenue,
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const productSalesChart = {
    labels: analyticsData.productSales.map(p => p.name),
    datasets: [
      {
        label: 'Units Sold',
        data: analyticsData.productSales.map(p => p.quantity),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(147, 51, 234, 0.8)',
          'rgba(236, 72, 153, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  };

  const categoryChart = {
    labels: analyticsData.categoryDistribution.map(c => c.name),
    datasets: [
      {
        data: analyticsData.categoryDistribution.map(c => c.count),
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(147, 51, 234, 0.8)',
          'rgba(236, 72, 153, 0.8)',
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  const orderStatusChart = {
    labels: ['Placed', 'Shipped', 'In Transit', 'Delivered'],
    datasets: [
      {
        data: [
          analyticsData.orderStatus.placed,
          analyticsData.orderStatus.shipped,
          analyticsData.orderStatus.in_transit,
          analyticsData.orderStatus.delivered,
        ],
        backgroundColor: [
          'rgba(251, 146, 60, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(34, 197, 94, 0.8)',
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 12,
            family: 'Inter, sans-serif',
          },
          padding: 15,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 14,
        },
        bodyFont: {
          size: 12,
        },
        padding: 12,
        cornerRadius: 8,
      },
    },
  };

  if (loading) {
    return (
      <div className="analytics-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h2>Analytics Dashboard</h2>
        <p>Track your farm's performance and sales insights</p>
        
        <div className="time-range-selector">
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="1year">Last Year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card revenue">
          <div className="metric-icon">Rs</div>
          <div className="metric-content">
            <h3>Total Revenue</h3>
            <p className="metric-value">Rs {analyticsData.totalRevenue.toFixed(2)}</p>
            <span className="metric-change positive">+12.5%</span>
          </div>
        </div>

        <div className="metric-card orders">
          <div className="metric-icon">O</div>
          <div className="metric-content">
            <h3>Total Orders</h3>
            <p className="metric-value">{analyticsData.totalOrders}</p>
            <span className="metric-change positive">+8.2%</span>
          </div>
        </div>

        <div className="metric-card products">
          <div className="metric-icon">P</div>
          <div className="metric-content">
            <h3>Products Listed</h3>
            <p className="metric-value">{analyticsData.totalProducts}</p>
            <span className="metric-change neutral">0%</span>
          </div>
        </div>

        <div className="metric-card avg-order">
          <div className="metric-icon">A</div>
          <div className="metric-content">
            <h3>Avg Order Value</h3>
            <p className="metric-value">Rs {analyticsData.averageOrderValue.toFixed(2)}</p>
            <span className="metric-change positive">+5.3%</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Monthly Revenue Chart */}
        <div className="chart-container">
          <h3>Monthly Revenue Trend</h3>
          <div className="chart-wrapper">
            <Bar data={monthlyRevenueChart} options={chartOptions} />
          </div>
        </div>

        {/* Product Sales Chart */}
        <div className="chart-container">
          <h3>Top Selling Products</h3>
          <div className="chart-wrapper">
            <Bar data={productSalesChart} options={chartOptions} />
          </div>
        </div>

        {/* Category Distribution */}
        <div className="chart-container">
          <h3>Product Categories</h3>
          <div className="chart-wrapper">
            <Pie data={categoryChart} options={chartOptions} />
          </div>
        </div>

        {/* Order Status */}
        <div className="chart-container">
          <h3>Order Status Distribution</h3>
          <div className="chart-wrapper">
            <Pie data={orderStatusChart} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="recent-orders-section">
        <h3>Recent Orders</h3>
        <div className="orders-table">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {analyticsData.recentOrders.map(order => (
                <tr key={order._id}>
                  <td>#{order._id.slice(-6)}</td>
                  <td>{order.shipping?.fullName || 'N/A'}</td>
                  <td>Rs {order.amount.toFixed(2)}</td>
                  <td>
                    <span className={`status-badge ${order.status}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default FarmerAnalytics;
