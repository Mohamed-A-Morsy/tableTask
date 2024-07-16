import React, { useState, useEffect } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import "bootstrap/dist/css/bootstrap.min.css";
import { Modal, Button } from "react-bootstrap";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const App = () => {
  const [customers, setCustomers] = useState([]);
  const [customerTransactions, setCustomerTransactions] = useState({});
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [nameFilter, setNameFilter] = useState("");
  const [amountFilter, setAmountFilter] = useState("");

  const getCustomerData = async () => {
    try {
      const customerResponse = await axios.get(
        "http://localhost:5000/customers"
      );
      setCustomers(customerResponse.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const getTransactionData = async () => {
    try {
      const transactionResponse = await axios.get(
        "http://localhost:5000/transactions"
      );
      const groupedTransactions = transactionResponse.data.reduce(
        (acc, transaction) => {
          const customerId = transaction.customer_id;
          if (!acc[customerId]) {
            acc[customerId] = { totalAmount: 0, transactions: [] };
          }
          acc[customerId].totalAmount += transaction.amount;
          acc[customerId].transactions.push(transaction);
          return acc;
        },
        {}
      );
      setCustomerTransactions(groupedTransactions);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getCustomerData();
    getTransactionData();
  }, []);

  const getLastTransactionDate = (customerId) => {
    const lastTransaction =
      customerTransactions[customerId]?.transactions.slice(-1)[0];
    return lastTransaction
      ? new Date(lastTransaction.date).toLocaleDateString("en-GB")
      : "No transactions";
  };

  const handleViewGraph = (customerId) => {
    setSelectedCustomer(customerId);

    const customerTransactionsData =
      customerTransactions[customerId]?.transactions || [];
    const labels = customerTransactionsData.map((transaction) =>
      new Date(transaction.date).toLocaleDateString("en-GB")
    );
    const amounts = customerTransactionsData.map(
      (transaction) => transaction.amount
    );

    const graphData = {
      labels: labels,
      datasets: [
        {
          label: 'Transactions',
          data: amounts,
          fill: false,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }
      ]
    };

    setGraphData(graphData); // Set the graph data
    setShowModal(true); // Show the modal
  };

  const filteredCustomers = customers.filter((customer) => {
    const nameMatch = customer.name
      .toLowerCase()
      .includes(nameFilter.toLowerCase());
    const totalAmount = customerTransactions[customer.id]?.totalAmount || 0;
    const amountMatch =
      !amountFilter || totalAmount >= parseFloat(amountFilter);
    return nameMatch && amountMatch;
  });

  return (
    <div className="container my-5">
      <h1 className="mb-4">Customer Transactions</h1>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by Name"
          className="form-control mb-2"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
        />
        <input
          type="number"
          placeholder="Search by Total Amount"
          className="form-control"
          value={amountFilter}
          onChange={(e) => setAmountFilter(e.target.value)}
        />
      </div>

      <table className="table table-striped table-hover text-center">
        <thead>
          <tr>
            <th>Customer ID</th>
            <th>Name</th>
            <th>Total Transaction Amount</th>
            <th>Last Transaction Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredCustomers.map((customer) => (
            <tr key={customer.id}>
              <td>{customer.id}</td>
              <td>{customer.name}</td>
              <td>{customerTransactions[customer.id]?.totalAmount || 0}</td>
              <td>{getLastTransactionDate(customer.id)}</td>
              <td>
                <button
                  className="btn btn-primary"
                  onClick={() => handleViewGraph(customer.id)}
                >
                  View Graph
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Graph for Customer ID: {selectedCustomer}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{graphData && <Line data={graphData} />}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default App;
