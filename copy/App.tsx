import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Copy, RefreshCw, Settings, Send, Home, History, Menu, X, Lightbulb, HelpCircle } from 'lucide-react';

type Mode = 'encrypt' | 'decrypt';
type Algorithm = 'vigenere' | 'atbash' | 'caesar';
type View = 'home' | 'encrypt' | 'decrypt';
type DecryptMode = 'universal' | 'known';

interface RecentOperation {
  id: string;
  type: 'encrypt' | 'decrypt';
  text: string;
  result: string;
  timestamp: Date;
  algorithm?: Algorithm;
  key?: string; // Добавляем поле для ключа
}

interface CipherInfo {
  name: string;
  history: string;
  description: string;
  creatorImage: string;
  creatorName: string;
}

interface EncryptionStep {
  step: number;
  description: string;
  input: string;
  key?: string;
  shift?: number;
  result: string;
  details: string[];
  animation?: boolean;
}

const CIPHER_INFO: Record<Algorithm, CipherInfo> = {
  vigenere: {
    name: 'Шифр Виженера',
    history: 'Шифр Виженера был впервые описан в 1553 году Джованни Баттиста Беллазо, но назван в честь Блеза де Виженера, который описал его в 1586 году. Долгое время этот шифр считался нераскрываемым, за что получил прозвище "le chiffre indéchiffrable" (неразгаданный шифр).',
    description: 'Шифр Виженера - это метод полиалфавитного шифрования буквенного текста с использованием ключевого слова. Это улучшенная версия шифра Цезаря, использующая разные шифры Цезаря для каждой буквы сообщения.',
    creatorImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Vigenere.jpg/274px-Vigenere.jpg',
    creatorName: 'Блез де Виженер'
  },
  atbash: {
    name: 'Шифр Атбаш',
    history: 'Атбаш - древний шифр подстановки, изначально использовавшийся для еврейского алфавита. Он упоминается в книге пророка Иеремии, где слово "Шешах" является зашифрованным словом "Вавилон".',
    description: 'В этом шифре первая буква алфавита заменяется на последнюю, вторая - на предпоследнюю и так далее. Название происходит от первых и последних букв еврейского алфавита (Алеф-Тав-Бет-Шин).',
    creatorImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/123.The_Prophet_Jeremiah.jpg/800px-123.The_Prophet_Jeremiah.jpg',
    creatorName: 'Книга пророка Иеремии'
  },
  caesar: {
    name: 'Шифр Цезаря',
    history: 'Назван в честь римского императора Гая Юлия Цезаря, использовавшего его для секретной переписки со своими генералами. Это один из самых ранних известных методов шифрования.',
    description: 'В шифре Цезаря каждый символ в открытом тексте заменяется символом, находящимся на некотором постоянном числе позиций левее или правее него в алфавите. Например, при сдвиге +3: А→Г, Б→Д, В→Е и так далее.',
    creatorImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Cicero_-_Musei_Capitolini.JPG/250px-Cicero_-_Musei_Capitolini.JPG',
    creatorName: 'Гай Юлий Цезарь'
  }
};

const slideDownAnimation = `
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
`;

const styles = `
  .processing-container {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1000;
  }

  .processing-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
  }

  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }

  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(156, 163, 175, 0.3);
    border-radius: 3px;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: rgba(156, 163, 175, 0.5);
  }
`;

const lightbulbAnimation = `
@keyframes glow {
  from {
    filter: drop-shadow(0 0 2px #FCD34D);
  }
  to {
    filter: drop-shadow(0 0 8px #FCD34D);
  }
}
`;

// Добавим новую анимацию для плавного появления шагов
const stepAnimation = `
@keyframes stepAppear {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
`;

function App() {
  
  const [mode, setMode] = useState<Mode>('encrypt');
  const [algorithm, setAlgorithm] = useState<Algorithm>('vigenere');
  const [input, setInput] = useState('');
  const [key, setKey] = useState('');
  const [result, setResult] = useState('');
  const [copyStatus, setCopyStatus] = useState("Копировать"); // Новое состояние для кнопки копирования
  const [currentView, setCurrentView] = useState<View>('home');
  const [isLoading, setIsLoading] = useState(false);
  const [recentOperations, setRecentOperations] = useState<RecentOperation[]>(() => {
    const saved = localStorage.getItem('recentOperations');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedOperation, setSelectedOperation] = useState<RecentOperation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [includeYo, setIncludeYo] = useState(true);
  const [decryptMode, setDecryptMode] = useState<DecryptMode>('universal');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isLightbulbHovered, setIsLightbulbHovered] = useState(false);
  const [showEncryptionSteps, setShowEncryptionSteps] = useState(false);
  const [encryptionSteps, setEncryptionSteps] = useState<EncryptionStep[]>([]);
  const [showAIWarning, setShowAIWarning] = useState(false);
  const [hasAcceptedAITerms, setHasAcceptedAITerms] = useState(() => {
    const saved = localStorage.getItem('acceptedAITerms');
    return saved ? JSON.parse(saved) : false;
  });
  const [pendingDecryption, setPendingDecryption] = useState(false);

  const thinkingEmojiUrl = "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/refs/heads/main/Smileys/Face%20With%20Monocle.webp";

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem('recentOperations', JSON.stringify(recentOperations));
  }, [recentOperations]);

  const addRecentOperation = (text: string, type: 'encrypt' | 'decrypt', result: string, algorithm?: Algorithm, key?: string) => {
    const newOperation: RecentOperation = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      text,
      result,
      timestamp: new Date(),
      algorithm,
      key
    };
  
    setRecentOperations(prev => [newOperation, ...prev]);
  };

  const handleAlgorithmChange = (newAlgorithm: Algorithm) => {
    setAlgorithm(newAlgorithm);
    setResult('');
    setKey('');
  };

  const handleViewChange = (newView: View) => {
    setCurrentView(newView);
    setResult('');
    setInput('');
    setKey('');
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const handleEncrypt = () => {
    let encrypted = '';
    
    switch(algorithm) {
      case 'vigenere':
        encrypted = vigenereEncrypt(input, key, includeYo);
        addRecentOperation(input, 'encrypt', encrypted, algorithm, key);
        break;
      case 'atbash':
        encrypted = atbashEncrypt(input, includeYo);
        addRecentOperation(input, 'encrypt', encrypted, algorithm);
        break;
      case 'caesar':
        encrypted = caesarEncrypt(input, parseInt(key) || 3, includeYo);
        addRecentOperation(input, 'encrypt', encrypted, algorithm);
        break;
    }
    
    setResult(encrypted);
  };  

  const handleDecrypt = async () => {
    if (!input) {
      alert('Пожалуйста, введите текст для расшифровки');
      return;
    }

    if (decryptMode === 'universal') {
      if (!hasAcceptedAITerms) {
        setShowAIWarning(true);
        setPendingDecryption(true);
        return;
      }
      
      setIsProcessing(true);
      try {
        setIsLoading(true);
        setResult('Анализ текста...');

        const response = await fetch('http://cipherbase.vdi.mipt.ru/decrypt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: `${input}${includeYo ? 1 : 0}` })
        });

        const data = await response.json();
        
        if (data.error) {
          setResult(`Ошибка: ${data.error}`);
        } else if (data.result === "Unexpected Error: 'NoneType' object is not subscriptable") {
          setResult('Gemini api занят');
        } else {
          setResult(data.result || 'Читаемый текст не найден');
          addRecentOperation(input, 'decrypt', data.result || 'Читаемый текст не найден');
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
        setResult(`Ошибка: ${errorMessage}`);
      } finally {
        setIsLoading(false);
        setIsProcessing(false);
      }
    } else {
      let decrypted = '';
      switch(algorithm) {
        case 'vigenere':
          if (!key) {
            alert('Пожалуйста, введите ключ для расшифровки');
            return;
          }
          decrypted = vigenereDecrypt(input, key, includeYo);
          addRecentOperation(input, 'decrypt', decrypted, algorithm, key);
          break;
        case 'atbash':
          decrypted = atbashEncrypt(input, includeYo);
          addRecentOperation(input, 'decrypt', decrypted, algorithm);
          break;
        case 'caesar':
          if (!key) {
            alert('Пожалуйста, введите сдвиг для расшифровки');
            return;
          }
          decrypted = caesarDecrypt(input, parseInt(key) || 3, includeYo);
          addRecentOperation(input, 'decrypt', decrypted, algorithm);
          break;
      }
      
      setResult(decrypted);
    }
  };

  const handleDecryptWithKey = () => {
    if (!input) {
      alert('Пожалуйста, введите текст для расшифровки');
      return;
    }

    let decrypted = '';
    switch(algorithm) {
      case 'vigenere':
        if (!key) {
          alert('Пожалуйста, введите ключ для расшифровки');
          return;
        }
        decrypted = vigenereDecrypt(input, key, includeYo);
        addRecentOperation(input, 'decrypt', decrypted, algorithm, key);
        break;
      case 'atbash':
        decrypted = atbashEncrypt(input, includeYo);
        addRecentOperation(input, 'decrypt', decrypted, algorithm);
        break;
      case 'caesar':
        if (!key) {
          alert('Пожалуйста, введите сдвиг для расшифровки');
          return;
        }
        decrypted = caesarDecrypt(input, parseInt(key) || 3, includeYo);
        addRecentOperation(input, 'decrypt', decrypted, algorithm);
        break;
    }
    
    setResult(decrypted);
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(result);
      } else {
        // Резервный вариант для браузеров без Clipboard API
        const textarea = document.createElement("textarea");
        textarea.value = result;
        textarea.style.position = "fixed";
        textarea.style.top = "0";
        textarea.style.left = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopyStatus("Скопировано!");
      setTimeout(() => {
        setCopyStatus("Копировать");
      }, 2000);
    } catch (error) {
      console.error("Ошибка копирования:", error);
    }
  };

  const thinkingAnimation = `
    @keyframes thinking {
      from {
        transform: scale(1);
      }
      to {
        transform: scale(1.1);
      }
    }
  `;

  const thinkingStyle = {
    animation: 'thinking 0.5s ease-in-out infinite alternate',
    width: '120px',
    height: '120px',
  };

  const handleDecryptModeChange = (newMode: DecryptMode) => {
    setDecryptMode(newMode);
    setResult('');
  };

  const handleDeleteOperation = (id: string) => {
    setRecentOperations(prev => prev.filter(op => op.id !== id));
  };

  const generateSteps = (text: string, isEncryption: boolean = true): EncryptionStep[] => {
    const steps: EncryptionStep[] = [];
    
    switch(algorithm) {
      case 'vigenere':
        if (!key) return [];
        
        // Подготовка алфавитов с учетом флага includeYo
        const RUSSIAN_ALPHABET_UPPER = includeYo 
          ? "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ" 
          : "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ";
        const RUSSIAN_ALPHABET_LOWER = includeYo 
          ? "абвгдеёжзийклмнопрстуфхцчшщъыьэюя" 
          : "абвгдежзийклмнопрстуфхцчшщъыьэюя";
        
        let currentResult = '';
        let displayKey = "";
        let keyIndex = 0;
        
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          let stepDetails: string[] = [];
          if (/[A-Za-zА-ЯЁа-яё]/.test(char)) {
            const currentKey = key[keyIndex % key.length].toUpperCase();
            displayKey += currentKey;
            
            if (/[A-Za-z]/.test(char)) {
              const isUpperCase = char === char.toUpperCase();
              const alphabet = isUpperCase ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ" : "abcdefghijklmnopqrstuvwxyz";
              const charIndex = alphabet.indexOf(char);
              const keyShift = currentKey.charCodeAt(0) - 'A'.charCodeAt(0);
              const newIndex = isEncryption
                ? (charIndex + keyShift) % alphabet.length
                : ((charIndex - keyShift + alphabet.length) % alphabet.length);
              const newChar = alphabet[newIndex];
              currentResult += newChar;
              stepDetails = [
                `Текущий символ: ${char} (позиция в алфавите: ${charIndex})`,
                `Символ ключа: ${currentKey} (сдвиг: ${keyShift})`,
                `${isEncryption ? 'Сдвиг вправо' : 'Сдвиг влево'} на ${keyShift} позиций`,
                `Новая позиция: ${newIndex}`,
                `Результат: ${newChar}`
              ];
            } else if (/[А-ЯЁ]/.test(char)) {
              const charIndex = RUSSIAN_ALPHABET_UPPER.indexOf(char);
              let keyShift;
              if (/[А-ЯЁ]/.test(currentKey)) {
                keyShift = RUSSIAN_ALPHABET_UPPER.indexOf(currentKey);
              } else {
                keyShift = currentKey.charCodeAt(0) - 'A'.charCodeAt(0);
              }
              const newIndex = isEncryption
                ? ((charIndex + keyShift) % RUSSIAN_ALPHABET_UPPER.length + RUSSIAN_ALPHABET_UPPER.length) % RUSSIAN_ALPHABET_UPPER.length
                : ((charIndex - keyShift + RUSSIAN_ALPHABET_UPPER.length) % RUSSIAN_ALPHABET_UPPER.length);
              const newChar = RUSSIAN_ALPHABET_UPPER[newIndex];
              currentResult += newChar;
              stepDetails = [
                `Текущий символ: ${char} (позиция в алфавите: ${charIndex})`,
                `Символ ключа: ${currentKey} (сдвиг: ${keyShift})`,
                `${isEncryption ? 'Сдвиг вправо' : 'Сдвиг влево'} на ${keyShift} позиций`,
                `Новая позиция: ${newIndex}`,
                `Результат: ${newChar}`
              ];
            } else if (/[а-яё]/.test(char)) {
              const charIndex = RUSSIAN_ALPHABET_LOWER.indexOf(char);
              let keyShift;
              if (/[А-ЯЁ]/.test(currentKey)) {
                keyShift = RUSSIAN_ALPHABET_UPPER.indexOf(currentKey);
              } else {
                keyShift = currentKey.charCodeAt(0) - 'A'.charCodeAt(0);
              }
              const newIndex = isEncryption
                ? ((charIndex + keyShift) % RUSSIAN_ALPHABET_LOWER.length + RUSSIAN_ALPHABET_LOWER.length) % RUSSIAN_ALPHABET_LOWER.length
                : ((charIndex - keyShift + RUSSIAN_ALPHABET_LOWER.length) % RUSSIAN_ALPHABET_LOWER.length);
              const newChar = RUSSIAN_ALPHABET_LOWER[newIndex];
              currentResult += newChar;
              stepDetails = [
                `Текущий символ: ${char} (позиция в алфавите: ${charIndex})`,
                `Символ ключа: ${currentKey} (сдвиг: ${keyShift})`,
                `${isEncryption ? 'Сдвиг вправо' : 'Сдвиг влево'} на ${keyShift} позиций`,
                `Новая позиция: ${newIndex}`,
                `Результат: ${newChar}`
              ];
            }
            keyIndex++;
            steps.push({
              step: i + 2,
              description: `${isEncryption ? 'Шифрование' : 'Расшифровка'} символа "${char}"`,
              input: text.slice(0, i + 1),
              key: displayKey,
              result: currentResult,
              details: stepDetails,
              animation: true
            });
          } else {
            displayKey += " ";
            currentResult += char;
            steps.push({
              step: i + 2,
              description: `Символ "${char}" не изменяется`,
              input: text.slice(0, i + 1),
              key: displayKey,
              result: currentResult,
              details: [`Символ "${char}" не является буквой и остается без изменений`],
              animation: false
            });
          }
        }
        break;

      case 'atbash':
        let atbashResult = '';
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          
          if (/[A-Za-zА-ЯЁа-яё]/.test(char)) {
            const alphabet = /[А-ЯЁ]/.test(char) 
              ? (includeYo ? "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ" : "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ")
              : (/[а-яё]/.test(char)
                ? (includeYo ? "абвгдеёжзийклмнопрстуфхцчшщъыьэюя" : "абвгдежзийклмнопрстуфхцчшщъыьэюя")
                : (/[A-Z]/.test(char) ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ" : "abcdefghijklmnopqrstuvwxyz"));
          
            const charIndex = alphabet.indexOf(char);
            const newIndex = alphabet.length - 1 - charIndex;
            atbashResult += alphabet[newIndex];
            
            steps.push({
              step: i + 1,
              description: `Замена символа "${char}"`,
              input: text.slice(0, i + 1),
              result: atbashResult,
              details: [
                `Текущий символ: ${char} (позиция в алфавите: ${charIndex})`,
                `Новая позиция: ${newIndex} (с конца алфавита)`,
                `Результат: ${alphabet[newIndex]}`
              ],
              animation: true
            });
          } else {
            atbashResult += char;
            steps.push({
              step: i + 1,
              description: `Символ "${char}" не изменяется`,
              input: text.slice(0, i + 1),
              result: atbashResult,
              details: [`Символ "${char}" не является буквой и остается без изменений`],
              animation: false
            });
          }
        }
        break;

      case 'caesar':
        if (!key) return [];
        const shift = parseInt(key);
        
        let caesarResult = '';
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          
          if (/[A-Za-zА-ЯЁа-яё]/.test(char)) {
            const alphabet = /[А-ЯЁ]/.test(char) 
              ? (includeYo ? "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ" : "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ")
              : (/[а-яё]/.test(char)
                ? (includeYo ? "абвгдеёжзийклмнопрстуфхцчшщъыьэюя" : "абвгдежзийклмнопрстуфхцчшщъыьэюя")
                : (/[A-Z]/.test(char) ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ" : "abcdefghijklmnopqrstuvwxyz"));
          
            const charIndex = alphabet.indexOf(char);
            const newIndex = isEncryption
              ? ((charIndex + shift) % alphabet.length + alphabet.length) % alphabet.length 
              : ((charIndex - shift) % alphabet.length + alphabet.length) % alphabet.length;
            caesarResult += alphabet[newIndex];
            
            steps.push({
              step: i + 1,
              description: `${isEncryption ? 'Шифрование' : 'Расшифровка'} символа "${char}"`,
              input: text.slice(0, i + 1),
              shift: shift,
              result: caesarResult,
              details: [
                `Текущий символ: ${char} (позиция в алфавите: ${charIndex})`,
                `Сдвиг: ${shift} позиций`,
                `Новая позиция: ${newIndex}`,
                `Результат: ${alphabet[newIndex]}`
              ],
              animation: true
            });
          } else {
            caesarResult += char;
            steps.push({
              step: i + 1,
              description: `Символ "${char}" не изменяется`,
              input: text.slice(0, i + 1),
              shift: shift,
              result: caesarResult,
              details: [`Символ "${char}" не является буквой и остается без изменений`],
              animation: false
            });
          }
        }
        break;
    }
    
    return steps;
  };

  const renderCipherInfoModal = () => {
    if (!isInfoModalOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <style>{stepAnimation}</style>
        <div className={`rounded-lg p-4 md:p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto ${
          isDarkMode ? 'bg-[#1E1E1E]' : 'bg-white'
        }`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className={`text-xl md:text-2xl font-bold ${
              isDarkMode ? 'text-gray-300' : 'text-gray-900'
            }`}>
              {CIPHER_INFO[algorithm].name}
            </h3>
            <div className="flex items-center space-x-2 md:space-x-4">
              <button
                onClick={() => {
                  if (showEncryptionSteps) {
                    setShowEncryptionSteps(false);
                  } else {
                    setShowEncryptionSteps(true);
                    setEncryptionSteps(generateSteps(input || 'ПРИВЕТ', currentView !== 'decrypt'));
                  }
                }}
                className={`flex items-center space-x-1 md:space-x-2 px-2 md:px-3 py-1 rounded-lg text-xs md:text-sm ${
                  isDarkMode 
                    ? 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30'
                    : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                }`}
              >
                <span className="line-clamp-1">
                  {showEncryptionSteps 
                    ? 'К описанию' 
                    : `Пошаговое ${currentView === 'decrypt' ? 'расшифрование' : 'шифрование'}`
                  }
                </span>
              </button>
              <button
                onClick={() => setIsInfoModalOpen(false)}
                className={`${
                  isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-500'
                }`}
              >
                <X className="h-5 w-5 md:h-6 md:w-6" />
              </button>
            </div>
          </div>

          {!showEncryptionSteps ? (
            <div className="grid grid-cols-1 gap-6">
              <div className="flex space-x-6">
                <div className="w-1/3 flex-shrink-0">
                  <div className="aspect-w-1 aspect-h-1 rounded-lg overflow-hidden">
                    <img 
                      src={CIPHER_INFO[algorithm].creatorImage} 
                      alt={CIPHER_INFO[algorithm].creatorName}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className={`text-center mt-3 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <span className="font-medium text-sm">{CIPHER_INFO[algorithm].creatorName}</span>
                  </div>
                </div>
                
                <div className="w-2/3 space-y-4">
                  <div className={`rounded-lg p-4 ${
                    isDarkMode ? 'bg-[#2D2D2D]' : 'bg-gray-50'
                  }`}>
                    <h4 className={`text-lg font-semibold mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-900'
                    }`}>История</h4>
                    <p className={`text-sm leading-relaxed ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>{CIPHER_INFO[algorithm].history}</p>
                  </div>

                  <div className={`rounded-lg p-4 ${
                    isDarkMode ? 'bg-[#2D2D2D]' : 'bg-gray-50'
                  }`}>
                    <h4 className={`text-lg font-semibold mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-900'
                    }`}>Описание метода</h4>
                    <p className={`text-sm leading-relaxed ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>{CIPHER_INFO[algorithm].description}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Оставляем существующий код для пошагового шифрования
            <div className={`p-4 rounded-lg ${
              isDarkMode ? 'bg-[#2D2D2D]' : 'bg-gray-50'
            }`}>
              <div className="flex justify-between items-center mb-4">
                <h4 className={`text-lg font-semibold ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-900'
                }`}>Пошаговое шифрование</h4>
              </div>
              
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => {
                      const newInput = e.target.value;
                      setInput(newInput);
                    }}
                    placeholder="Введите текст для шифрования"
                    className={`flex-1 px-3 py-2 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-[#1E1E1E] border-[#3D3D3D] text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                    }`}
                  />
                  {algorithm !== 'atbash' && (
                    <input
                      type="text"
                      value={key}
                      onChange={(e) => {
                        const newKey = e.target.value;
                        setKey(newKey);
                      }}
                      placeholder={algorithm === 'caesar' ? 'Сдвиг' : 'Ключ'}
                      className={`w-24 md:w-32 px-3 py-2 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-[#1E1E1E] border-[#3D3D3D] text-white'
                          : 'bg-white border-gray-200 text-gray-900'
                      }`}
                    />
                  )}
                </div>

                <button
                  onClick={() => setEncryptionSteps(generateSteps(input, currentView !== 'decrypt'))}
                  className={`w-full py-2 rounded-lg font-medium transition-colors ${
                    isDarkMode 
                      ? 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30'
                      : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    {currentView === 'decrypt' ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                    <span>{currentView === 'decrypt' ? 'Расшифровать' : 'Зашифровать'}</span>
                  </div>
                </button>

                <div className={`max-h-[400px] overflow-y-auto custom-scrollbar space-y-4 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {encryptionSteps.length > 0 ? (
                    encryptionSteps.map((step, index) => (
                      <div 
                        key={index}
                        className={`p-4 rounded-lg ${
                          isDarkMode ? 'bg-[#1E1E1E]' : 'bg-white'
                        }`}
                        style={{
                          animation: `stepAppear 0.3s ease-out forwards`,
                          animationDelay: `${index * 0.1}s`,
                          opacity: 0
                        }}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <span className="font-medium text-lg">Шаг {step.step}</span>
                          <span className="text-sm opacity-75">{step.description}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className={`p-3 rounded-lg ${
                              isDarkMode ? 'bg-[#2D2D2D]' : 'bg-gray-50'
                            }`}>
                              <div className="text-sm font-medium mb-1">Входные данные</div>
                              <div className="font-mono break-all">{step.input}</div>
                            </div>
                            
                            {step.key && (
                              <div className={`p-3 rounded-lg ${
                                isDarkMode ? 'bg-[#2D2D2D]' : 'bg-gray-50'
                              }`}>
                                <div className="text-sm font-medium mb-1">Ключ</div>
                                <div className="font-mono break-all">{step.key}</div>
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <div className={`p-3 rounded-lg ${
                              isDarkMode ? 'bg-[#2D2D2D]' : 'bg-gray-50'
                            }`}>
                              <div className="text-sm font-medium mb-1">Результат</div>
                              <div className="font-mono break-all">{step.result}</div>
                            </div>

                            <div className={`p-3 rounded-lg ${
                              isDarkMode ? 'bg-[#2D2D2D]' : 'bg-gray-50'
                            }`}>
                              <div className="text-sm font-medium mb-1">Детали</div>
                              <ul className="list-disc list-inside space-y-1">
                                {step.details.map((detail, i) => (
                                  <li key={i} className="text-sm">{detail}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      Введите текст и нажмите "Зашифровать"
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return (
          <div className="flex flex-col items-center justify-center h-full p-8 space-y-8">
            <div className="text-center space-y-4">
              <h1 className={`text-3xl font-bold ${
                isDarkMode ? 'text-gray-300' : 'text-gray-900'
              }`}>Добро пожаловать в CipherBase</h1>
              <p className={`text-gray-600 max-w-lg ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Мощный инструмент для шифрования и дешифрования, поддерживающая исскуственный интеллект. Включает шифры Виженера, Атбаш и Цезаря.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
              <div onClick={() => handleViewChange('encrypt')} className={`p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
                isDarkMode ? 'bg-[#2D2D2D]' : 'bg-white'
              }`}>
                <Lock className={`w-8 h-8 mb-3 ${
                  isDarkMode ? 'text-indigo-400' : 'text-indigo-600'
                }`} />
                <h3 className={`text-lg font-semibold ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-900'
                }`}>Зашифровать</h3>
                <p className={`text-sm mt-2 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Защитите ваши сообщения с помощью различных методов шифрования</p>
              </div>
              <div onClick={() => handleViewChange('decrypt')} className={`p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
                isDarkMode ? 'bg-[#2D2D2D]' : 'bg-white'
              }`}>
                <Unlock className={`w-8 h-8 mb-3 ${
                  isDarkMode ? 'text-indigo-400' : 'text-indigo-600'
                }`} />
                <h3 className={`text-lg font-semibold ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-900'
                }`}>Расшифровать</h3>
                <p className={`text-sm mt-2 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Расшифруйте сообщения с помощью AI-анализа</p>
              </div>
            </div>
          </div>
        );
      case 'encrypt':
      case 'decrypt':
        return (
          <div className="max-w-3xl mx-auto p-6 space-y-6">
            {currentView === 'decrypt' && (
              <div className="flex items-center space-x-4 mb-6">
                <button
                  onClick={() => handleDecryptModeChange('universal')}
                  className={`flex-1 flex items-center justify-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                    decryptMode === 'universal'
                      ? isDarkMode
                        ? 'bg-indigo-500/20 text-indigo-400 ring-2 ring-indigo-500/40'
                        : 'bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/40'
                      : isDarkMode
                        ? 'bg-[#2D2D2D] text-gray-400 hover:bg-[#363636]'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <div className="flex items-center space-x-2 mb-1">
                      <RefreshCw className="w-5 h-5" />
                      <span className="font-medium">AI Расшифровка</span>
                    </div>
                    <span className="text-xs opacity-75">Автоматический подбор метода</span>
                  </div>
                </button>
                <button
                  onClick={() => handleDecryptModeChange('known')}
                  className={`flex-1 flex items-center justify-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                    decryptMode === 'known'
                      ? isDarkMode
                        ? 'bg-indigo-500/20 text-indigo-400 ring-2 ring-indigo-500/40'
                        : 'bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/40'
                      : isDarkMode
                        ? 'bg-[#2D2D2D] text-gray-400 hover:bg-[#363636]'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <div className="flex items-center space-x-2 mb-1">
                      <Lock className="w-5 h-5" />
                      <span className="font-medium">Известный шифр</span>
                    </div>
                    <span className="text-xs opacity-75">Выбор конкретного метода</span>
                  </div>
                </button>
              </div>
            )}

            {(currentView === 'encrypt' || (currentView === 'decrypt' && decryptMode === 'known')) && (
              <div className="grid grid-cols-3 gap-4 mb-6">
                {(['vigenere', 'atbash', 'caesar'] as Algorithm[]).map((alg) => (
                  <div key={alg} className="relative group h-full">
                    <button
                      onClick={() => handleAlgorithmChange(alg)}
                      className={`w-full h-full flex flex-col items-center justify-center p-4 rounded-xl transition-all ${
                        algorithm === alg
                          ? isDarkMode
                            ? 'bg-indigo-500/20 text-indigo-400 ring-2 ring-indigo-500/40'
                            : 'bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/40'
                          : isDarkMode
                            ? 'bg-[#2D2D2D] text-gray-400 hover:bg-[#363636]'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-lg font-medium capitalize mb-1">{CIPHER_INFO[alg].name}</span>
                      <span className="text-xs opacity-75 text-center line-clamp-2">
                        {CIPHER_INFO[alg].description.slice(0, 60)}...
                      </span>
                    </button>
                    {algorithm === alg && (
                      <button
                        onMouseEnter={() => setIsLightbulbHovered(true)}
                        onMouseLeave={() => setIsLightbulbHovered(false)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsInfoModalOpen(true);
                        }}
                        className={`absolute -top-2 -right-2 p-2 rounded-full ${
                          isDarkMode
                            ? 'bg-[#1E1E1E] text-yellow-400'
                            : 'bg-white text-yellow-500 shadow-md'
                        }`}
                        title="Узнать больше об этом шифре"
                      >
                        <Lightbulb 
                          className="w-5 h-5"
                          style={{
                            animation: isLightbulbHovered ? 'glow 1s ease-in-out infinite alternate' : 'none'
                          }}
                        />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>{currentView === 'encrypt' ? 'Исходный текст' : 'Зашифрованный текст'}</label>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={currentView === 'encrypt' ? 
                    "Введите текст для шифрования..." : 
                    "Введите текст для расшифровки..."}
                  className={`w-full h-32 p-4 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    isDarkMode 
                      ? 'bg-[#1E1E1E] border-[#2D2D2D] text-white placeholder-gray-400'
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-600'
                  }`}
                />
              </div>
              
              {(currentView === 'encrypt' || (currentView === 'decrypt' && decryptMode === 'known')) && algorithm !== 'atbash' && (
                <div className="space-y-2">
                  <label className={`block text-sm font-medium ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {algorithm === 'caesar' ? 'Сдвиг' : 'Ключ шифрования'}
                  </label>
                  <input
                    type="text"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder={algorithm === 'caesar' ? 'Введите число сдвига' : 'Введите ключ шифрования'}
                    className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-[#1E1E1E] border-[#2D2D2D] text-white placeholder-gray-400'
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-600'
                    }`}
                  />
                </div>
              )}

              <div className="button-container">
                <button
                  onClick={currentView === 'encrypt' ? handleEncrypt : (decryptMode === 'universal' ? handleDecrypt : handleDecryptWithKey)}
                  disabled={isLoading || isProcessing}
                  className={`w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center space-x-2 ${
                    (isLoading || isProcessing) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="animate-spin w-5 h-5" />
                      <span>Обработка...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>{currentView === 'encrypt' ? 'Зашифровать' : 'Расшифровать'}</span>
                    </>
                  )}
                </button>
                {isProcessing && (
                  <>
                    <div className="processing-overlay" />
                    <div className="processing-container">
                      <img 
                        src={thinkingEmojiUrl}
                        alt="thinking" 
                        style={thinkingStyle}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {result && (
              <div className={`space-y-3 rounded-lg p-4 ${isDarkMode ? 'bg-[#2D2D2D]' : 'bg-gray-50'}`}>
                <div className="flex justify-between items-center">
                  <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>Результат</h3>
                  <button
                    onClick={handleCopy}
                    className={`flex items-center space-x-1 ${
                      isDarkMode 
                        ? 'text-gray-400 hover:text-gray-300'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Copy className="w-4 h-4" />
                    <span className="text-sm">{copyStatus}</span>
                  </button>
                </div>
                <div className={`break-all ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {result}
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  const handleAcceptAITerms = () => {
    setHasAcceptedAITerms(true);
    localStorage.setItem('acceptedAITerms', 'true');
    setShowAIWarning(false);
    if (pendingDecryption) {
      setPendingDecryption(false);
      handleDecrypt();
    }
  };

  const renderAIWarningModal = () => {
    if (!showAIWarning) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className={`rounded-lg p-6 max-w-2xl w-full space-y-6 ${
          isDarkMode ? 'bg-[#1E1E1E]' : 'bg-white'
        }`}>
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-2">
              <HelpCircle className={`w-6 h-6 ${
                isDarkMode ? 'text-yellow-400' : 'text-yellow-500'
              }`} />
              <h3 className={`text-xl font-semibold ${
                isDarkMode ? 'text-gray-300' : 'text-gray-900'
              }`}>
                Важное уведомление
              </h3>
            </div>
            <button
              onClick={() => {
                setShowAIWarning(false);
                setPendingDecryption(false);
              }}
              className={`${
                isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-500'
              }`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className={`space-y-4 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            <p className="font-medium">
              Функция дешифровки с использованием ИИ предназначена исключительно для образовательных и исследовательских целей. Используя эту функцию, вы подтверждаете, что понимаете и принимаете следующие условия:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Вы будете использовать функцию ИИ исключительно в законных и этичных целях.</li>
              <li>Вы осознаете, что результаты дешифровки ИИ могут быть неточными и не гарантируют 100% успеха.</li>
              <li>Вы принимаете на себя полную ответственность за использование полученной информации и понимаете, что администрация сайта не несет ответственности за последствия.</li>
              <li>Вы соглашаетесь не использовать функцию ИИ для расшифровки информации, полученной незаконным путем, или для любых противоправных действий.</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              onClick={() => {
                setShowAIWarning(false);
                setPendingDecryption(false);
              }}
              className={`px-4 py-2 rounded-lg ${
                isDarkMode 
                  ? 'bg-[#2D2D2D] text-gray-300 hover:bg-[#363636]'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Отмена
            </button>
            <button
              onClick={handleAcceptAITerms}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Принимаю условия
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex min-h-screen ${isDarkMode ? 'bg-[#121212] text-white' : 'bg-gray-100'}`}>
      <style>{slideDownAnimation}</style>
      <style>{thinkingAnimation}</style>
      <style>{styles}</style>
      <style>{lightbulbAnimation}</style>
      <style>{stepAnimation}</style>
      
      {isMobile && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className={`fixed top-4 left-4 z-50 p-2 rounded-lg ${
            isDarkMode ? 'bg-[#2D2D2D] text-gray-300' : 'bg-white text-gray-700'
          }`}
        >
          <Menu className="w-6 h-6" />
        </button>
      )}

      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      <div className={`${
        isMobile 
          ? `fixed top-0 left-0 bottom-0 z-50 transform transition-transform duration-300 ease-in-out ${
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`
          : 'relative'
      } w-64 border-r flex flex-col ${isDarkMode ? 'bg-[#1E1E1E] border-[#2D2D2D]' : 'bg-white border-gray-200'}`}>
        
        {isMobile && (
          <button
            onClick={() => setIsSidebarOpen(false)}
            className={`absolute top-4 right-4 p-2 rounded-lg ${
              isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'
            }`}
          >
            <X className="w-6 h-6" />
          </button>
        )}

        <div className={`p-4 border-b ${isDarkMode ? 'border-[#2D2D2D]' : 'border-gray-200'}`}>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>CipherBase</h1>
            </div>
          </div>
        </div>
        
        <nav className="p-4 space-y-1">
          <button
            onClick={() => handleViewChange('home')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm ${
              currentView === 'home'
                ? isDarkMode 
                  ? 'bg-indigo-500/20 text-indigo-400 font-medium'
                  : 'bg-indigo-50 text-indigo-600 font-medium'
                : isDarkMode 
                  ? 'text-gray-400 hover:bg-[#2D2D2D]'
                  : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Home className="w-5 h-5" />
            <span>Главная</span>
          </button>
          <button
            onClick={() => handleViewChange('encrypt')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm ${
              currentView === 'encrypt'
                ? isDarkMode 
                  ? 'bg-indigo-500/20 text-indigo-400 font-medium'
                  : 'bg-indigo-50 text-indigo-600 font-medium'
                : isDarkMode 
                  ? 'text-gray-400 hover:bg-[#2D2D2D]'
                  : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Lock className="w-5 h-5" />
            <span>Зашифровать</span>
          </button>
          <button
            onClick={() => handleViewChange('decrypt')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm ${
              currentView === 'decrypt'
                ? isDarkMode 
                  ? 'bg-indigo-500/20 text-indigo-400 font-medium'
                  : 'bg-indigo-50 text-indigo-600 font-medium'
                : isDarkMode 
                  ? 'text-gray-400 hover:bg-[#2D2D2D]'
                  : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Unlock className="w-5 h-5" />
            <span>Расшифровать</span>
          </button>
        </nav>

        <div className="px-4 flex-1 overflow-hidden">
          <div className={`border-t pt-4 ${isDarkMode ? 'border-[#2D2D2D]' : 'border-gray-200'}`}>
            <div className={`flex items-center space-x-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
              <History className="w-4 h-4" />
              <span>История операций</span>
            </div>
            <div className="space-y-2 overflow-y-auto h-[calc(100vh-400px)] pr-2 custom-scrollbar">
              {recentOperations.map((op, index) => (
                <div
                  key={op.id}
                  className={`p-2 rounded-lg text-sm relative group ${
                    isDarkMode 
                      ? 'bg-[#2D2D2D] hover:bg-[#363636]' 
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  style={{
                    animation: index === 0 ? 'slideDown 0.3s ease-out' : 'none'
                  }}
                >
                  <div 
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedOperation(op);
                      setIsModalOpen(true);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 min-w-0">
                        <div className="flex-shrink-0">
                          {op.type === 'encrypt' ? (
                            <Lock className="w-4 h-4 text-indigo-400" />
                          ) : (
                            <Unlock className="w-4 h-4 text-green-400" />
                          )}
                        </div>
                        <span className={`truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {op.text}
                        </span>
                      </div>
                      {op.algorithm && (
                        <span className={`text-xs capitalize flex-shrink-0 ml-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          {op.algorithm}
                        </span>
                      )}
                    </div>
                    <div className={`text-xs truncate ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      Результат: {op.result}
                    </div>
                    {op.algorithm === 'vigenere' && op.key && (
                      <div className={`text-xs truncate ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        Ключ: {op.key}
                      </div>
                    )}
                    <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      {new Date(op.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteOperation(op.id);
                    }}
                    className={`absolute bottom-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
                      isDarkMode 
                        ? 'hover:bg-[#454545] text-gray-400 hover:text-gray-300' 
                        : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {recentOperations.length === 0 && (
                <div className="text-sm text-gray-500 text-center py-2">
                  Нет недавних операций
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={`p-4 border-t ${isDarkMode ? 'border-[#2D2D2D]' : 'border-gray-200'}`}>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className={`w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm rounded-lg ${
              isDarkMode 
                ? 'text-gray-400 hover:bg-[#2D2D2D]' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span>Настройки</span>
          </button>
        </div>
      </div>

      <div className={`flex-1 ${isMobile ? 'pt-16' : ''}`}>
        <main className="h-full">
          {renderContent()}
        </main>
      </div>

      {isModalOpen && selectedOperation && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsModalOpen(false);
            }
          }}
        >
          <div className={`rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto ${
            isDarkMode ? 'bg-[#1E1E1E]' : 'bg-white'
          }`}>
            <div className="flex justify-between items-center">
              <h3 className={`text-lg font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-900'
              }`}>
                Детали операции
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className={`${
                  isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-500'
                }`}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4 mt-4">
              <div>
                <label className={`block text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-700'
                }`}>Тип операции</label>
                <div className="mt-1 flex items-center space-x-2">
                  {selectedOperation.type === 'encrypt' ? (
                    <Lock className={`w-4 h-4 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                  ) : (
                    <Unlock className={`w-4 h-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                  )}
                  <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                    {selectedOperation.type === 'encrypt' ? 'Шифрование' : 'Расшифровка'}
                  </span>
                </div>
              </div>

              {selectedOperation.algorithm && (
                <div>
                  <label className={`block text-sm font-medium ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-700'
                  }`}>Алгоритм</label>
                  <div className={`mt-1 capitalize ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-900'
                  }`}>{selectedOperation.algorithm}</div>
                </div>
              )}

              <div>
                <label className={`block text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-700'
                }`}>Исходный текст</label>
                <div className={`mt-1 p-3 rounded-lg break-all ${
                  isDarkMode ? 'bg-[#2D2D2D] text-gray-300' : 'bg-gray-50 text-gray-900'
                }`}>{selectedOperation.text}</div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-700'
                }`}>Результат</label>
                <div className={`mt-1 p-3 rounded-lg break-all ${
                  isDarkMode ? 'bg-[#2D2D2D] text-gray-300' : 'bg-gray-50 text-gray-900'
                }`}>{selectedOperation.result}</div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-700'
                }`}>Время</label>
                <div className={`mt-1 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-900'
                }`}>
                  {new Date(selectedOperation.timestamp).toLocaleString()}
                </div>
              </div>

              {selectedOperation.algorithm === 'vigenere' && selectedOperation.key && (
                <div>
                  <label className={`block text-sm font-medium ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-700'
                  }`}>Ключ</label>
                  <div className={`mt-1 p-3 rounded-lg break-all ${
                    isDarkMode ? 'bg-[#2D2D2D] text-gray-300' : 'bg-gray-50 text-gray-900'
                  }`}>{selectedOperation.key}</div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className={`px-4 py-2 rounded-lg ${
                  isDarkMode 
                    ? 'bg-[#2D2D2D] text-gray-300 hover:bg-[#363636]'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {isSettingsOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsSettingsOpen(false);
            }
          }}
        >
          <div className={`rounded-lg p-6 max-w-md w-full space-y-4 ${
            isDarkMode ? 'bg-[#1E1E1E]' : 'bg-white'
          }`}>
            <div className="flex justify-between items-center">
              <h3 className={`text-lg font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-900'
              }`}>
                Настройки
              </h3>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className={`${
                  isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-500'
                }`}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>Темная тема</label>
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isDarkMode ? 'bg-indigo-600' : 'bg-gray-200'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                    Использовать букву Ё
                  </label>
                  <div className="relative group">
                    <HelpCircle 
                      className={`w-4 h-4 ${
                        isDarkMode ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-500'
                      }`}
                    />
                    <div className={`absolute left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity ${
                      isDarkMode 
                        ? 'bg-[#2D2D2D] text-gray-300 border border-[#3D3D3D]' 
                        : 'bg-white text-gray-600 border border-gray-200 shadow-sm'
                    } ${
                      // Добавляем условное позиционирование подсказки
                      window.innerWidth < 768 ? 'top-full mt-2' : 'bottom-full mb-2'
                    }`}>
                      Некоторые шифраторы не используют букву Ё
                      <div className={`absolute ${
                        // Меняем позицию стрелки в зависимости от ширины экрана
                        window.innerWidth < 768 
                          ? 'top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-45'
                          : 'bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45'
                      } w-2 h-2 ${
                        isDarkMode 
                          ? 'bg-[#2D2D2D] border-r border-b border-[#3D3D3D]' 
                          : 'bg-white border-r border-b border-gray-200'
                      }`}></div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIncludeYo(!includeYo)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${includeYo ? 'bg-indigo-600' : 'bg-gray-200'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${includeYo ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </button>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className={`px-4 py-2 rounded-lg ${
                  isDarkMode 
                    ? 'bg-[#2D2D2D] text-gray-300 hover:bg-[#363636]'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {renderCipherInfoModal()}

      {renderAIWarningModal()}
    </div>
  );
}

function vigenereEncrypt(text: string, key: string, includeYo: boolean): string {
  const RUSSIAN_ALPHABET_UPPER = includeYo 
    ? "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ" 
    : "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ";
  const RUSSIAN_ALPHABET_LOWER = includeYo 
    ? "абвгдеёжзийклмнопрстуфхцчшщъыьэюя" 
    : "абвгдежзийклмнопрстуфхцчшщъыьэюя";
  
  let result = '';
  let keyIndex = 0;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const keyChar = key[keyIndex % key.length].toUpperCase();
    
    if (/[A-Za-z]/.test(char)) {
      const isUpperCase = char === char.toUpperCase();
      const alphabet = isUpperCase ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ" : "abcdefghijklmnopqrstuvwxyz";
      const charIndex = alphabet.indexOf(char);
      const keyShift = keyChar.charCodeAt(0) - 'A'.charCodeAt(0);
      const newIndex = (charIndex + keyShift) % alphabet.length;
      result += alphabet[newIndex];
      keyIndex++;
    } else if (/[А-ЯЁ]/.test(char)) {
      const charIndex = RUSSIAN_ALPHABET_UPPER.indexOf(char);
      if (charIndex !== -1) {
        let keyShift;
        if (/[А-ЯЁ]/.test(keyChar)) {
          keyShift = RUSSIAN_ALPHABET_UPPER.indexOf(keyChar);
        } else {
          keyShift = keyChar.charCodeAt(0) - 'A'.charCodeAt(0);
        }
        const newIndex = (charIndex + keyShift) % RUSSIAN_ALPHABET_UPPER.length;
        result += RUSSIAN_ALPHABET_UPPER[newIndex];
        keyIndex++;
      } else {
        result += char;
      }
    } else if (/[а-яё]/.test(char)) {
      const charIndex = RUSSIAN_ALPHABET_LOWER.indexOf(char);
      if (charIndex !== -1) {
        let keyShift;
        if (/[А-ЯЁ]/.test(keyChar)) {
          keyShift = RUSSIAN_ALPHABET_UPPER.indexOf(keyChar);
        } else {
          keyShift = keyChar.charCodeAt(0) - 'A'.charCodeAt(0);
        }
        const newIndex = (charIndex + keyShift) % RUSSIAN_ALPHABET_LOWER.length;
        result += RUSSIAN_ALPHABET_LOWER[newIndex];
        keyIndex++;
      } else {
        result += char;
      }
    } else {
      result += char;
    }
  }
  
  return result;
}

function atbashEncrypt(text: string, includeYo: boolean): string {
  const RUSSIAN_ALPHABET_UPPER = includeYo 
    ? "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ" 
    : "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ";
  const RUSSIAN_ALPHABET_LOWER = includeYo 
    ? "абвгдеёжзийклмнопрстуфхцчшщъыьэюя" 
    : "абвгдежзийклмнопрстуфхцчшщъыьэюя";
  
  return text
    .split('')
    .map(char => {
      if (/[A-Z]/.test(char)) {
        return String.fromCharCode('Z'.charCodeAt(0) - (char.charCodeAt(0) - 'A'.charCodeAt(0)));
      }
      if (/[a-z]/.test(char)) {
        return String.fromCharCode('z'.charCodeAt(0) - (char.charCodeAt(0) - 'a'.charCodeAt(0)));
      }
      if (/[А-ЯЁ]/.test(char)) {
        const index = includeYo ? RUSSIAN_ALPHABET_UPPER.indexOf(char) : RUSSIAN_ALPHABET_UPPER.replace('Ё', '').indexOf(char);
        if (index === -1) return char;
        return RUSSIAN_ALPHABET_UPPER[RUSSIAN_ALPHABET_UPPER.length - 1 - index];
      }
      if (/[а-яё]/.test(char)) {
        const index = includeYo ? RUSSIAN_ALPHABET_LOWER.indexOf(char) : RUSSIAN_ALPHABET_LOWER.replace('ё', '').indexOf(char);
        if (index === -1) return char;
        return RUSSIAN_ALPHABET_LOWER[RUSSIAN_ALPHABET_LOWER.length - 1 - index];
      }
      return char;
    })
    .join('');
}

function caesarEncrypt(text: string, shift: number, includeYo: boolean): string {
  const RUSSIAN_ALPHABET_UPPER = includeYo 
    ? "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ" 
    : "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ";
  const RUSSIAN_ALPHABET_LOWER = includeYo 
    ? "абвгдеёжзийклмнопрстуфхцчшщъыьэюя" 
    : "абвгдежзийклмнопрстуфхцчшщъыьэюя";
  
  return text
    .split('')
    .map(char => {
      if (/[A-Z]/.test(char)) {
        const code = ((char.charCodeAt(0) - 65 + shift) % 26 + 26) % 26;
        return String.fromCharCode(code + 65);
      }
      if (/[a-z]/.test(char)) {
        const code = ((char.charCodeAt(0) - 97 + shift) % 26 + 26) % 26;
        return String.fromCharCode(code + 97);
      }
      if (/[А-ЯЁ]/.test(char)) {
        const index = includeYo ? RUSSIAN_ALPHABET_UPPER.indexOf(char) : RUSSIAN_ALPHABET_UPPER.replace('Ё', '').indexOf(char);
        if (index === -1) return char;
        const encryptedIndex = ((index + shift) % RUSSIAN_ALPHABET_UPPER.length + RUSSIAN_ALPHABET_UPPER.length) % RUSSIAN_ALPHABET_UPPER.length;
        return RUSSIAN_ALPHABET_UPPER[encryptedIndex];
      }
      if (/[а-яё]/.test(char)) {
        const index = includeYo ? RUSSIAN_ALPHABET_LOWER.indexOf(char) : RUSSIAN_ALPHABET_LOWER.replace('ё', '').indexOf(char);
        if (index === -1) return char;
        const encryptedIndex = ((index + shift) % RUSSIAN_ALPHABET_LOWER.length + RUSSIAN_ALPHABET_LOWER.length) % RUSSIAN_ALPHABET_LOWER.length;
        return RUSSIAN_ALPHABET_LOWER[encryptedIndex];
      }
      return char;
    })
    .join('');
}

function vigenereDecrypt(text: string, key: string, includeYo: boolean): string {
  const RUSSIAN_ALPHABET_UPPER = includeYo 
    ? "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ" 
    : "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ";
  const RUSSIAN_ALPHABET_LOWER = includeYo 
    ? "абвгдеёжзийклмнопрстуфхцчшщъыьэюя" 
    : "абвгдежзийклмнопрстуфхцчшщъыьэюя";
  
  let result = '';
  let keyIndex = 0;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const keyChar = key[keyIndex % key.length].toUpperCase();
    
    if (/[A-Za-z]/.test(char)) {
      const isUpperCase = char === char.toUpperCase();
      const alphabet = isUpperCase ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ" : "abcdefghijklmnopqrstuvwxyz";
      const charIndex = alphabet.indexOf(char);
      const keyShift = keyChar.charCodeAt(0) - 'A'.charCodeAt(0);
      const newIndex = (charIndex - keyShift + alphabet.length) % alphabet.length;
      result += alphabet[newIndex];
      keyIndex++;
    } else if (/[А-ЯЁ]/.test(char)) {
      const charIndex = RUSSIAN_ALPHABET_UPPER.indexOf(char);
      if (charIndex !== -1) {
        let keyShift;
        if (/[А-ЯЁ]/.test(keyChar)) {
          keyShift = RUSSIAN_ALPHABET_UPPER.indexOf(keyChar);
        } else {
          keyShift = keyChar.charCodeAt(0) - 'A'.charCodeAt(0);
        }
        const newIndex = (charIndex - keyShift + RUSSIAN_ALPHABET_UPPER.length) % RUSSIAN_ALPHABET_UPPER.length;
        result += RUSSIAN_ALPHABET_UPPER[newIndex];
        keyIndex++;
      } else {
        result += char;
      }
    } else if (/[а-яё]/.test(char)) {
      const charIndex = RUSSIAN_ALPHABET_LOWER.indexOf(char);
      if (charIndex !== -1) {
        let keyShift;
        if (/[А-ЯЁ]/.test(keyChar)) {
          keyShift = RUSSIAN_ALPHABET_UPPER.indexOf(keyChar);
        } else {
          keyShift = keyChar.charCodeAt(0) - 'A'.charCodeAt(0);
        }
        const newIndex = (charIndex - keyShift + RUSSIAN_ALPHABET_LOWER.length) % RUSSIAN_ALPHABET_LOWER.length;
        result += RUSSIAN_ALPHABET_LOWER[newIndex];
        keyIndex++;
      } else {
        result += char;
      }
    } else {
      result += char;
    }
  }
  
  return result;
}

function caesarDecrypt(text: string, shift: number, includeYo: boolean): string {
  return caesarEncrypt(text, -shift, includeYo);
}

export default App;
