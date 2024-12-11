import React, { useState, useEffect } from "react";
import { ref, set, get } from "firebase/database";
import { rtdb } from "../utils/firebaseConfig";
import "./FeedingAmountComponent.css"; // Import the CSS file

const FeedingAmountComponent: React.FC = () => {
  const [amount, setAmount] = useState<string>("Just Right"); // Default "Just Right"
  const [duration, setDuration] = useState<number>(5); // Default 5

  const feedingOptions = [
    { label: "Little", value: 3 },
    { label: "Just Right", value: 5 },
    { label: "A Lot", value: 10 },
  ];

  // Retrieve data on component mount
  useEffect(() => {
    const amountRef = ref(rtdb, "HISTORY/feedingAmount/amount");
    const durationRef = ref(rtdb, "HISTORY/feedingAmount/duration");

    // Fetch existing values from Firebase
    get(amountRef).then((snapshot) => {
      if (snapshot.exists()) {
        setAmount(snapshot.val());
      }
    });

    get(durationRef).then((snapshot) => {
      if (snapshot.exists()) {
        setDuration(snapshot.val());
      }
    });
  }, []);

  const handleCheckboxChange = (label: string, value: number) => {
    setAmount(label);
    setDuration(value);

    // Update Firebase
    set(ref(rtdb, "HISTORY/feedingAmount/amount"), label);
    set(ref(rtdb, "HISTORY/feedingAmount/duration"), value);
  };

  return (
    <div>
      <h3>Choose Feeding Amount</h3>
      <div className="feeding-container">
        {feedingOptions.map((option) => (
          <div key={option.label} className="checkbox-item">
            <input
              type="checkbox"
              id={option.label}
              checked={amount === option.label}
              onChange={() => handleCheckboxChange(option.label, option.value)}
            />
            <label htmlFor={option.label}>{option.label}</label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeedingAmountComponent;
