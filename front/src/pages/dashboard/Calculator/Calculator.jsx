import React, { useState, useEffect } from "react";
import {
  FaTimes,
  FaDivide,
  FaPlus,
  FaMinus,
  FaEquals,
  FaBackspace,
  FaRegCircle,
  FaPercentage,
  FaSquareRootAlt,
  FaUndo,
  FaHistory,
  FaCalculator
} from "react-icons/fa";

const Calculator = ({ onResult, initialValue = "0", className = "" }) => {
  const [display, setDisplay] = useState(initialValue);
  const [previousValue, setPreviousValue] = useState(null);
  const [operator, setOperator] = useState(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [memory, setMemory] = useState(0);

  // Clear all
  const clearAll = () => {
    setDisplay("0");
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  };

  // Clear entry
  const clearEntry = () => {
    setDisplay("0");
  };

  // Backspace
  const backspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay("0");
    }
  };

  // Toggle sign (+/-)
  const toggleSign = () => {
    const value = parseFloat(display);
    setDisplay(String(-value));
  };

  // Percentage
  const percentage = () => {
    const value = parseFloat(display);
    setDisplay(String(value / 100));
  };

  // Square root
  const squareRoot = () => {
    const value = parseFloat(display);
    if (value < 0) {
      setDisplay("خطا");
      setTimeout(() => setDisplay("0"), 1000);
      return;
    }
    const result = Math.sqrt(value);
    setDisplay(String(result));
    addToHistory(`√(${value}) = ${result}`);
  };

  // Add to history
  const addToHistory = (calculation) => {
    setHistory(prev => [calculation, ...prev].slice(0, 10));
  };

  // Handle number input
  const inputNumber = (num) => {
    if (waitingForOperand) {
      setDisplay(String(num));
      setWaitingForOperand(false);
    } else {
      setDisplay(display === "0" ? String(num) : display + num);
    }
  };

  // Handle decimal point
  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
    } else if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  };

  // Handle operator
  const handleOperator = (nextOperator) => {
    const currentValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(currentValue);
    } else if (operator) {
      const result = calculate(previousValue, currentValue, operator);
      setDisplay(String(result));
      setPreviousValue(result);
      
      // Add to history
      addToHistory(`${previousValue} ${operator} ${currentValue} = ${result}`);
      
      if (onResult) {
        onResult(result);
      }
    }

    setWaitingForOperand(true);
    setOperator(nextOperator);
  };

  // Calculate result
  const calculate = (first, second, op) => {
    switch (op) {
      case "+":
        return first + second;
      case "-":
        return first - second;
      case "*":
        return first * second;
      case "/":
        if (second === 0) {
          alert("تقسیم بر صفر مجاز نیست");
          return 0;
        }
        return first / second;
      default:
        return second;
    }
  };

  // Handle equals
  const handleEquals = () => {
    if (!previousValue || !operator) return;

    const currentValue = parseFloat(display);
    const result = calculate(previousValue, currentValue, operator);
    
    // Add to history
    addToHistory(`${previousValue} ${operator} ${currentValue} = ${result}`);
    
    setDisplay(String(result));
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(true);

    if (onResult) {
      onResult(result);
    }
  };

  // Memory functions
  const memoryClear = () => setMemory(0);
  const memoryRecall = () => setDisplay(String(memory));
  const memoryAdd = () => setMemory(memory + parseFloat(display));
  const memorySubtract = () => setMemory(memory - parseFloat(display));

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key >= "0" && e.key <= "9") {
        inputNumber(e.key);
      } else if (e.key === ".") {
        inputDecimal();
      } else if (e.key === "+") {
        handleOperator("+");
      } else if (e.key === "-") {
        handleOperator("-");
      } else if (e.key === "*") {
        handleOperator("*");
      } else if (e.key === "/") {
        handleOperator("/");
      } else if (e.key === "Enter" || e.key === "=") {
        e.preventDefault();
        handleEquals();
      } else if (e.key === "Backspace") {
        backspace();
      } else if (e.key === "Escape") {
        clearAll();
      } else if (e.key === "%") {
        percentage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [display, previousValue, operator, waitingForOperand]);

  // Button styles
  const buttonClass = "p-4 text-lg font-semibold rounded-lg transition-all duration-200 hover:shadow-md active:scale-95";
  const numberButtonClass = `${buttonClass} bg-gray-100 hover:bg-gray-200 text-gray-800`;
  const operatorButtonClass = `${buttonClass} bg-blue-100 hover:bg-blue-200 text-blue-800`;
  const functionButtonClass = `${buttonClass} bg-gray-200 hover:bg-gray-300 text-gray-700`;
  const equalsButtonClass = `${buttonClass} bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600`;

  return (
    <div className={`bg-white rounded-xl shadow-2xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaCalculator className="text-xl" />
            <h2 className="text-lg font-bold">ماشین حساب</h2>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 hover:bg-white/20 rounded-lg transition"
            title="نمایش تاریخچه"
          >
            <FaHistory />
          </button>
        </div>
      </div>

      {/* History Panel */}
      {showHistory && (
        <div className="bg-gray-50 border-b border-gray-200 p-3 max-h-40 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-gray-700">تاریخچه محاسبات</h3>
            <button
              onClick={() => setHistory([])}
              className="text-xs text-red-500 hover:text-red-700"
            >
              پاک کردن تاریخچه
            </button>
          </div>
          {history.length === 0 ? (
            <p className="text-sm text-gray-500 text-center">تاریخچه خالی است</p>
          ) : (
            history.map((item, index) => (
              <div
                key={index}
                className="text-sm text-gray-600 py-1 border-b border-gray-100 last:border-0"
              >
                {item}
              </div>
            ))
          )}
        </div>
      )}

      {/* Display */}
      <div className="bg-gray-900 p-6">
        <div className="bg-gray-800 rounded-lg p-4 text-left">
          <div className="text-gray-400 text-sm mb-1 h-5">
            {previousValue !== null && `${previousValue} ${operator || ""}`}
          </div>
          <div className="text-white text-3xl font-mono font-bold overflow-x-auto">
            {display}
          </div>
        </div>
      </div>

      {/* Memory Functions */}
      <div className="grid grid-cols-4 gap-2 p-4 bg-gray-100 border-b border-gray-200">
        <button
          onClick={memoryClear}
          className="p-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 font-medium"
          title="پاک کردن حافظه"
        >
          MC
        </button>
        <button
          onClick={memoryRecall}
          className="p-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 font-medium"
          title="بازیابی از حافظه"
        >
          MR
        </button>
        <button
          onClick={memoryAdd}
          className="p-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 font-medium"
          title="اضافه به حافظه"
        >
          M+
        </button>
        <button
          onClick={memorySubtract}
          className="p-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 font-medium"
          title="کسر از حافظه"
        >
          M-
        </button>
      </div>

      {/* Keypad */}
      <div className="p-4 grid grid-cols-4 gap-2">
        {/* Row 1 */}
        <button onClick={clearAll} className={`${functionButtonClass} text-red-600`}>
          AC
        </button>
        <button onClick={clearEntry} className={functionButtonClass}>
          C
        </button>
        <button onClick={backspace} className={functionButtonClass}>
          <FaBackspace className="mx-auto" />
        </button>
        <button onClick={handleOperator} value="/" className={operatorButtonClass}>
          <FaDivide className="mx-auto" />
        </button>

        {/* Row 2 */}
        <button onClick={() => inputNumber(7)} className={numberButtonClass}>
          7
        </button>
        <button onClick={() => inputNumber(8)} className={numberButtonClass}>
          8
        </button>
        <button onClick={() => inputNumber(9)} className={numberButtonClass}>
          9
        </button>
        <button onClick={() => handleOperator("*")} className={operatorButtonClass}>
          <FaTimes className="mx-auto" />
        </button>

        {/* Row 3 */}
        <button onClick={() => inputNumber(4)} className={numberButtonClass}>
          4
        </button>
        <button onClick={() => inputNumber(5)} className={numberButtonClass}>
          5
        </button>
        <button onClick={() => inputNumber(6)} className={numberButtonClass}>
          6
        </button>
        <button onClick={() => handleOperator("-")} className={operatorButtonClass}>
          <FaMinus className="mx-auto" />
        </button>

        {/* Row 4 */}
        <button onClick={() => inputNumber(1)} className={numberButtonClass}>
          1
        </button>
        <button onClick={() => inputNumber(2)} className={numberButtonClass}>
          2
        </button>
        <button onClick={() => inputNumber(3)} className={numberButtonClass}>
          3
        </button>
        <button onClick={() => handleOperator("+")} className={operatorButtonClass}>
          <FaPlus className="mx-auto" />
        </button>

        {/* Row 5 */}
        <button onClick={toggleSign} className={functionButtonClass}>
          +/-
        </button>
        <button onClick={() => inputNumber(0)} className={numberButtonClass}>
          0
        </button>
        <button onClick={inputDecimal} className={functionButtonClass}>
          .
        </button>
        <button onClick={handleEquals} className={equalsButtonClass}>
          <FaEquals className="mx-auto" />
        </button>

        {/* Row 6 - Extra functions */}
        <button onClick={percentage} className={functionButtonClass}>
          <FaPercentage className="mx-auto" />
        </button>
        <button onClick={squareRoot} className={functionButtonClass}>
          <FaSquareRootAlt className="mx-auto" />
        </button>
        <div className="col-span-2"></div>
      </div>

      {/* Result for external use */}
      {onResult && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={() => onResult(parseFloat(display))}
            className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition"
          >
            استفاده از نتیجه
          </button>
        </div>
      )}
    </div>
  );
};

export default Calculator;