"use client";

import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { FaTrash } from 'react-icons/fa';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Trade {
  name: string;
  amount: string;
  date: string;
}

const Graph = () => {
  const [trades, setTrades] = useState<Trade[]>(() => {
    // Load trades from local storage if available
    if (typeof window !== 'undefined') {
      const savedTrades = localStorage.getItem('trades');
      return savedTrades ? JSON.parse(savedTrades) : [];
    }
    return [];
  });
  const [trade, setTrade] = useState<Trade>({ name: '', amount: '', date: '' });
  const [totalAmount, setTotalAmount] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTrades = localStorage.getItem('trades');
      const tradesArray = savedTrades ? JSON.parse(savedTrades) : [];
      return tradesArray.length > 0 ? parseFloat(localStorage.getItem('totalAmount') || '0') : 0;
    }
    return 0;
  });
  const [warningMessage, setWarningMessage] = useState('');

  useEffect(() => {
    // Update local storage whenever trades change
    localStorage.setItem('trades', JSON.stringify(trades));
    localStorage.setItem('totalAmount', totalAmount.toString()); // Save totalAmount to local storage
  }, [trades, totalAmount]); // Add totalAmount to the dependency array

  const getColor = (amount: number) => {
    return amount >= 0 ? 'rgba(173, 216, 230, 1)' : 'rgba(255, 0, 0, 1)';
  };

  const data = {
    labels: trades.map((t: Trade) => t.date),
    datasets: [
      {
        label: 'Total Amount',
        data: trades.map((t, index) => trades.slice(0, index + 1).reduce((acc, trade) => acc + parseFloat(trade.amount), 0)), 
        borderColor: trades.map((t, index) => {
          const cumulativeAmount = trades.slice(0, index + 1).reduce((acc, trade) => acc + parseFloat(trade.amount), 0);
          return getColor(cumulativeAmount);
        }),
        backgroundColor: trades.map((t) => getColor(parseFloat(t.amount)).replace('1)', '0.2)')),
        pointRadius: 6, 
        pointBackgroundColor: trades.map((t) => getColor(parseFloat(t.amount))),
        hoverRadius: 8,
      },
    ],
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTrade({ ...trade, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Attempting to submit trade:', trade);
    const missingFields = [];
    if (!trade.name) missingFields.push('name');
    if (!trade.amount) missingFields.push('amount');
    if (!trade.date) missingFields.push('date');
    if (missingFields.length > 0) {
      console.log('Missing fields:', missingFields);
      alert('Fill out all fields to add trade');
      return;
    }
    setWarningMessage('');
    setTrades([...trades, trade]);
    setTotalAmount(totalAmount + parseFloat(trade.amount));
    setTrade({ name: '', amount: '', date: '' });
  };

  const handleDelete = (index: number) => {
    const amountToRemove = parseFloat(trades[index].amount); // Get the amount of the trade being deleted
    const newTrades = trades.filter((_, i) => i !== index);
    setTrades(newTrades);
    if (newTrades.length === 0) {
        setTotalAmount(0); // Reset totalAmount if no trades are left
    } else {
        setTotalAmount(totalAmount - amountToRemove); // Update totalAmount
    }
    localStorage.setItem('trades', JSON.stringify(newTrades));
  };

  return (
    <div className='graph-container w-[70vh] m-auto h-[100vh] flex flex-col items-center p-10'>
      <h2 className='total-amount text-2xl text-slate-300 mb-8 self-start'>Total Amount: ${totalAmount.toFixed(2)}</h2>
      <div className='graph w-full flex-grow flex items-center justify-center mb-8'>
        <Line 
          data={data} 
          options={{
            scales: {
              x: {
                ticks: {
                  color: 'rgba(173, 216, 230, 1)', 
                },
              },
              y: {
                ticks: {
                  color: 'rgba(173, 216, 230, 0.7)', 
                },
              },
            },
            plugins: {
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const trade = trades[context.dataIndex];
                    return [
                      `Trade: ${trade.name}`,
                      `Amount: $${trade.amount}`,
                      `Date: ${trade.date}`
                    ];
                  },
                },
              },
            },
          }}
        />
      </div>
      <div className='trade-form-container w-full flex flex-col items-center mt-20'>
        <div className='trade-form rounded-lg h-auto w-[90%] max-w-[450px] flex flex-col items-center p-5 bg-gray-800'>
          <h2 className='text-2xl font-semibold flex justify-center mb-5 text-slate-300'>Record a Trade</h2>
          <form onSubmit={handleSubmit} className='flex flex-col items-center'>
            <select
              name='name'
              value={trade.name}
              onChange={handleInputChange}
              className='mb-5 p-2 border text-gray-400 border-gray-400 rounded-sm w-full'
            >
              <option value=''>Select an Asset</option>
              <option value='Bitcoin'>Bitcoin</option>
              <option value='Litecoin'>Litecoin</option>
              <option value='AUDUSD'>AUDUSD</option>
              <option value='EURUSD'>EURUSD</option>
              <option value='GOLD'>GOLD</option>
            </select>
            <input
              type='number'
              name='amount'
              value={trade.amount}
              onChange={handleInputChange}
              placeholder='Amount'
              className='mb-5 p-2 border text-gray-400 border-gray-400 rounded-sm w-full'
            />
            {warningMessage && <p className='text-red-500'>{warningMessage}</p>}
            <input
              type='date'
              name='date'
              value={trade.date}
              onChange={handleInputChange}
              className='mb-5 p-2 border text-gray-400 border-gray-400 rounded-sm w-full'
            />
            <input
              type='submit'
              value='Add Trade'
              className='p-2 bg-zinc-800 text-gray-500 rounded-md hover:bg-gray-700' 
              disabled={!trade.name || !trade.amount || !trade.date}
            />
          </form>
        </div>
      </div>
      <div className='trade-history relative  w-[90%] min-h-[500px] flex flex-col items-center mt-20' >
        <h2 className='tradehistory-titletext-2xl font-semibold text-slate-300 mb-5 text-center sticky top-0'>Trade History</h2>
        <table className='min-w-full  bg-gray-800 text-gray-300 text-center mt-10'>
          <thead>
            <tr>
              <th colSpan={5} className='py-2 text-center'>Number of Trades: {trades.length}</th>
            </tr>
            <tr>
              <th className='py-2'>Asset</th>
              <th className='py-2'>Amount</th>
              <th className='py-2'>Date</th>
              <th className='py-2'>Delete</th>
            </tr>
          </thead>
          <tbody>
            {trades.slice(0, 10).map((trade, index) => (
              <tr key={index} className='border-b border-gray-700'>
                <td className='py-2 text-center'>{trade.name}</td>
                <td className='py-2 text-center' style={{ color: parseFloat(trade.amount) < 0 ? 'red' : 'green' }}>${trade.amount}</td>
                <td className='py-2 text-center'>{trade.date}</td>
                <td className='py-2 text-center'>
                  <button onClick={() => handleDelete(index)} className='text-red-500 hover:text-red-700'>
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Graph;
