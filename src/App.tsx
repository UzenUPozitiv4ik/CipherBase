import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Copy, RefreshCw, Settings, Send, Home, History, Menu, X, HelpCircle } from 'lucide-react';

type Mode = 'encrypt' | 'decrypt';
type Algorithm = 'vigenere' | 'atbash' | 'caesar' | 'a1z26' | 'bacon';
type Language = 'ru' | 'en';
type View = 'home' | 'encrypt' | 'decrypt';
type DecryptMode = 'universal' | 'known';

interface RecentOperation {
  id: string;
  type: 'encrypt' | 'decrypt';
  text: string;
  result: string;
  timestamp: Date;
  algorithm?: Algorithm;
  key?: string; 
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
  },
  a1z26: {
    name: 'Шифр A1Z26',
    history: 'Шифр A1Z26 - это простой шифр замены, где каждая буква заменяется её порядковым номером в алфавите. Он широко используется в головоломках и шифрах для детей и является отличным введением в криптографию.',
    description: 'В этом шифре каждая буква алфавита заменяется на её порядковый номер: A=1, B=2, ..., Z=26 для английского алфавита, и А=1, Б=2, ..., Я=33 для русского алфавита.',
    creatorImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Letter_of_Alexis_of_Russia.JPG/330px-Letter_of_Alexis_of_Russia.JPG',
    creatorName: 'Неизвестно'
  },
  bacon: {
    name: 'Шифр Бэкона',
    history: 'Шифр Бэкона был создан Фрэнсисом Бэконом в 16 веке. Он использовал этот шифр для скрытия сообщений в текстах своих произведений, что стало одним из первых примеров стеганографии в истории.',
    description: 'Шифр Бэкона представляет собой метод, в котором каждая буква текста заменяется на пятизначную комбинацию символов "a" и "b" (или других бинарных символов). Каждый пятибитный код соответствует одной букве алфавита.',
    creatorImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Francis_Bacon%2C_Viscount_St_Alban_from_NPG_%282%29.jpg/500px-Francis_Bacon%2C_Viscount_St_Alban_from_NPG_%282%29.jpg',
    creatorName: 'Фрэнсис Бэкон'
  }
};

const animations = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideInFromRight {
    from {
      transform: translateX(20px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
  
  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-6px); }
    100% { transform: translateY(0px); }
  }
  
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-15px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes glowBorder {
    0% { box-shadow: 0 0 0 0 rgba(129, 140, 248, 0.2); }
    70% { box-shadow: 0 0 0 10px rgba(129, 140, 248, 0); }
    100% { box-shadow: 0 0 0 0 rgba(129, 140, 248, 0); }
  }
  
  @keyframes shimmer {
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
  }
  
  /* Новые анимации */
  @keyframes gradientMove {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  
  @keyframes rippleEffect {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
  
  @keyframes gradientText {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  
  @keyframes rotateY {
    0% { transform: perspective(1000px) rotateY(0deg); }
    100% { transform: perspective(1000px) rotateY(360deg); }
  }
  
  @keyframes appear3D {
    from {
      opacity: 0;
      transform: perspective(500px) translateZ(-50px);
    }
    to {
      opacity: 1;
      transform: perspective(500px) translateZ(0);
    }
  }
  
  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
    40% {transform: translateY(-10px);}
    60% {transform: translateY(-5px);}
  }
  
  @keyframes typewriter {
    from {width: 0;}
    to {width: 100%;}
  }
  
  @keyframes blinkCursor {
    from, to {border-right-color: transparent;}
    50% {border-right-color: currentColor;}
  }
  
  @keyframes spin {
    from {transform: rotate(0deg);}
    to {transform: rotate(360deg);}
  }
  
  @keyframes breathe {
    0%, 100% {
      transform: scale(1);
      filter: brightness(1);
    }
    50% {
      transform: scale(1.03);
      filter: brightness(1.1);
    }
  }

  @keyframes floatSideway {
    0% {transform: translateX(0px);}
    50% {transform: translateX(10px);}
    100% {transform: translateX(0px);}
  }
  
  @keyframes rotateAnimation {
    0% {transform: rotate(0deg);}
    100% {transform: rotate(360deg);}
  }
  
  @keyframes flipIn {
    0% {
      opacity: 0;
      transform: perspective(400px) rotateX(90deg);
    }
    40% {
      transform: perspective(400px) rotateX(-10deg);
    }
    70% {
      transform: perspective(400px) rotateX(10deg);
    }
    100% {
      opacity: 1;
      transform: perspective(400px) rotateX(0deg);
    }
  }
  
  @keyframes popIn {
    0% {
      opacity: 0;
      transform: scale(0.5);
    }
    70% {
      transform: scale(1.1);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  /* Класcы анимаций */
  .floating {
    animation: float 6s ease-in-out infinite;
  }
  
  .floating-sideways {
    animation: floatSideway 5s ease-in-out infinite;
  }
  
  .fade-in {
    animation: fadeIn 0.4s ease-out forwards;
  }
  
  .slide-in {
    animation: slideInFromRight 0.3s ease-out forwards;
  }
  
  .pulse-on-hover:hover {
    animation: pulse 0.5s ease-in-out;
  }
  
  .appear-3d {
    animation: appear3D 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    opacity: 0;
  }
  
  .rotating {
    animation: rotateAnimation 20s linear infinite;
  }
  
  .gradient-animate {
    background-size: 200% 200%;
    animation: gradientMove 3s ease infinite;
  }
  
  .breathe {
    animation: breathe 5s ease-in-out infinite;
  }
  
  .flip-in {
    animation: flipIn 1s forwards;
    backface-visibility: hidden;
  }
  
  .pop-in {
    animation: popIn 0.5s forwards;
  }
  
  .bounce {
    animation: bounce 2s infinite;
  }
  
  .typewriter {
    overflow: hidden;
    white-space: nowrap;
    border-right: 3px solid;
    width: 0;
    animation: 
      typewriter 2.5s steps(40, end) forwards,
      blinkCursor 0.75s step-end infinite;
  }
  
  .spin {
    animation: spin 1.5s linear infinite;
  }
  
  .ripple {
    position: relative;
    overflow: hidden;
  }
  
  .ripple::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    width: 5px;
    height: 5px;
    background: rgba(255, 255, 255, 0.4);
    border-radius: 100%;
    transform: scale(0);
    opacity: 1;
    animation: rippleEffect 0.6s ease-out;
  }
`;

const particles = `
  .particle-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    z-index: 0;
  }
  
  .particle {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
    opacity: 0.5;
  }
  
  .particle:nth-child(1) {
    width: 80px;
    height: 80px;
    background: radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0) 70%);
    top: 15%;
    left: 10%;
    animation: float 15s ease-in-out infinite;
  }
  
  .particle:nth-child(2) {
    width: 120px;
    height: 120px;
    background: radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0) 70%);
    top: 60%;
    left: 80%;
    animation: float 18s ease-in-out infinite reverse;
  }
  
  .particle:nth-child(3) {
    width: 100px;
    height: 100px;
    background: radial-gradient(circle, rgba(236, 72, 153, 0.15) 0%, rgba(236, 72, 153, 0) 70%);
    top: 40%;
    left: 25%;
    animation: float 12s ease-in-out infinite 1s;
  }
  
  .particle:nth-child(4) {
    width: 150px;
    height: 150px;
    background: radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0) 70%);
    top: 75%;
    left: 30%;
    animation: float 20s ease-in-out infinite;
  }
  
  .particle:nth-child(5) {
    width: 70px;
    height: 70px;
    background: radial-gradient(circle, rgba(249, 115, 22, 0.1) 0%, rgba(249, 115, 22, 0) 70%);
    top: 20%;
    left: 65%;
    animation: float 13s ease-in-out infinite 2s;
  }
  
  .blur-circle {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.07;
    pointer-events: none;
  }
  
  .dark .blur-circle {
    opacity: 0.05;
  }
  
  .blur-circle-1 {
    width: 500px;
    height: 500px;
    background: #6366f1;
    top: -10%;
    left: -10%;
    animation: float 25s ease-in-out infinite;
  }
  
  .blur-circle-2 {
    width: 400px;
    height: 400px;
    background: #8b5cf6;
    bottom: -5%;
    right: -5%;
    animation: float 20s ease-in-out infinite 1s;
  }
  
  .blur-circle-3 {
    width: 300px;
    height: 300px;
    background: #ec4899;
    bottom: 30%;
    left: 10%;
    animation: float 18s ease-in-out infinite 2s;
  }
`;

const styles = `
  .glassmorphism {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .glassmorphism-dark {
    background: rgba(16, 16, 16, 0.75);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .glassmorphism-light {
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.1);
  }
  
  .neomorphism-dark {
    box-shadow: 
      -5px -5px 10px rgba(255, 255, 255, 0.05),
      5px 5px 15px rgba(0, 0, 0, 0.5);
  }
  
  .neomorphism-light {
    box-shadow: 
      -5px -5px 10px rgba(255, 255, 255, 0.8),
      5px 5px 10px rgba(0, 0, 0, 0.1);
  }
  
  .gradient-border {
    position: relative;
    border-radius: 16px;
  }
  
  .gradient-border::before {
    content: "";
    position: absolute;
    top: -2px; right: -2px; bottom: -2px; left: -2px;
    z-index: -1;
    border-radius: 18px;
    background: linear-gradient(to right, #6366f1, #8b5cf6, #ec4899);
  }
  
  .shimmer {
    background: linear-gradient(90deg, 
      rgba(255, 255, 255, 0) 0%, 
      rgba(255, 255, 255, 0.1) 50%, 
      rgba(255, 255, 255, 0) 100%);
    background-size: 200% 100%;
    animation: shimmer 2s infinite;
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
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(5px);
    z-index: 999;
  }
  
  /* Градиентные фоны и кнопки */
  .bg-gradient-primary {
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    background-size: 200% 200%;
    animation: gradientMove 3s ease infinite;
  }
  
  .bg-gradient-secondary {
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
    background-size: 200% 200%;
    animation: gradientMove 3s ease infinite;
  }
  
  .bg-gradient-success {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    background-size: 200% 200%;
    animation: gradientMove 3s ease infinite;
  }
  
  .btn-gradient {
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    background-size: 200% 200%;
    animation: gradientMove 3s ease infinite;
    transition: all 0.3s ease;
  }
  
  .btn-gradient:hover {
    background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(79, 70, 229, 0.3);
  }
  
  /* Динамические градиентные фоны */
  .bg-mesh {
    background-color: hsla(242, 100%, 26%, 1);
    background-image:
      radial-gradient(at 69% 8%, hsla(242, 82%, 24%, 1) 0px, transparent 50%),
      radial-gradient(at 97% 82%, hsla(262, 66%, 34%, 1) 0px, transparent 50%),
      radial-gradient(at 2% 65%, hsla(256, 93%, 20%, 1) 0px, transparent 50%),
      radial-gradient(at 15% 15%, hsla(212, 48%, 45%, 1) 0px, transparent 50%);
    position: relative;
  }
  
  .bg-mesh-light {
    background-color: hsla(210, 100%, 98%, 1);
    background-image:
      radial-gradient(at 69% 8%, hsla(210, 100%, 95%, 1) 0px, transparent 50%),
      radial-gradient(at 97% 82%, hsla(220, 100%, 95%, 1) 0px, transparent 50%),
      radial-gradient(at 2% 65%, hsla(210, 100%, 95%, 1) 0px, transparent 50%),
      radial-gradient(at 15% 15%, hsla(180, 100%, 97%, 1) 0px, transparent 50%);
    position: relative;
  }
  
  /* Эффект 3D сдвига */
  .hover-3d {
    transition: transform 0.3s ease-out;
  }
  
  .hover-3d:hover {
    transform: perspective(1000px) rotateX(2deg) rotateY(4deg) scale(1.02);
  }
  
  /* Эффект движения для градиентного текста */
  .gradient-text {
    background-image: linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899, #6366f1);
    background-size: 300% auto;
    color: transparent;
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: gradientText 3s ease-in-out infinite;
  }
  
  /* Эффект свечения */
  .glow {
    box-shadow: 0 0 10px 0 rgba(99, 102, 241, 0.3);
    transition: box-shadow 0.3s ease;
  }
  
  .glow:hover {
    box-shadow: 0 0 20px 0 rgba(99, 102, 241, 0.5);
  }
  
  /* Анимированные кнопки с волновым эффектом */
  .btn-wave {
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
  }
  
  .btn-wave:after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
    transform: scale(0);
    opacity: 0;
    transition: transform 0.5s, opacity 0.3s;
  }
  
  .btn-wave:active:after {
    transform: scale(2);
    opacity: 0;
    transition: 0s;
  }
  
  /* Стили для индикатора загрузки */
  .loader {
    width: 30px;
    height: 30px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: #fff;
    animation: spin 1s ease-in-out infinite;
  }
`;

const lightbulbAnimation = `
  @keyframes glow {
    from {
      filter: drop-shadow(0 0 3px #FCD34D);
    }
    to {
      filter: drop-shadow(0 0 14px #FCD34D);
    }
  }

  @keyframes vibrate {
    0% { transform: translateX(0); }
    25% { transform: translateX(1px); }
    50% { transform: translateX(0); }
    75% { transform: translateX(-1px); }
    100% { transform: translateX(0); }
  }

  .lightbulb-glow {
    animation: glow 1.5s ease-in-out infinite alternate, vibrate 0.3s linear infinite;
  }
`;

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

.step-appear {
  animation: stepAppear 0.5s ease-out forwards;
}
`;

function App() {
  
  const [mode, setMode] = useState<Mode>('encrypt');
  const [algorithm, setAlgorithm] = useState<Algorithm>('vigenere');
  const [input, setInput] = useState('');
  const [key, setKey] = useState('');
  const [result, setResult] = useState('');
  const [copyStatus, setCopyStatus] = useState("Копировать");
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
    return saved ? JSON.parse(saved) : true;
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [includeYo, setIncludeYo] = useState(true);
  const [language, setLanguage] = useState<Language>('ru');
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
  const [isMenuItemHovered, setIsMenuItemHovered] = useState<string | null>(null);
  const [cardHover, setCardHover] = useState<string | null>(null);
  const [buttonHover, setButtonHover] = useState<string | null>(null);
  const [showParticles, setShowParticles] = useState(true);
  const [animationPreference, setAnimationPreference] = useState<'high' | 'medium' | 'low'>('high');
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);

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
      case 'a1z26':
        encrypted = a1z26Encrypt(input, language);
        addRecentOperation(input, 'encrypt', encrypted, algorithm);
        break;
      case 'bacon':
        encrypted = baconEncrypt(input, language);
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
        case 'a1z26':
          decrypted = a1z26Decrypt(input, language);
          addRecentOperation(input, 'decrypt', decrypted, algorithm);
          break;
        case 'bacon':
          decrypted = baconDecrypt(input, language);
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
      case 'a1z26':
        decrypted = a1z26Decrypt(input, language);
        addRecentOperation(input, 'decrypt', decrypted, algorithm);
        break;
      case 'bacon':
        decrypted = baconDecrypt(input, language);
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
        transform: scale(1) rotate(0deg);
      }
      to {
        transform: scale(1.1) rotate(5deg);
      }
    }
  `;

  const thinkingStyle = {
    animation: 'thinking 0.8s ease-in-out infinite alternate',
    width: '150px',
    height: '150px',
    filter: 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.5))'
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
      case 'bacon':
        const RU_ALPHABET_BACON = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя';
        const EN_ALPHABET_BACON = 'abcdefghijklmnopqrstuvwxyz';
        const selectedAlphabet = language === 'ru' ? RU_ALPHABET_BACON : EN_ALPHABET_BACON;
        
        const baconCodes: Record<string, string> = {};
        
        for (let i = 0; i < selectedAlphabet.length; i++) {
          const binaryCode = i.toString(2).padStart(5, '0').replace(/0/g, 'a').replace(/1/g, 'b');
          baconCodes[selectedAlphabet[i]] = binaryCode;
        }
        const reverseBaconCodes: Record<string, string> = {};
        for (const [char, code] of Object.entries(baconCodes)) {
          reverseBaconCodes[code] = char;
        }
        
        let baconResult = '';
        let currentWord = '';
        
        if (isEncryption) {
          for (let i = 0; i < text.length; i++) {
            const char = text[i].toLowerCase();
            
            if (selectedAlphabet.includes(char)) {
              const code = baconCodes[char];
              currentWord += code;
              baconResult = currentWord;
              
              steps.push({
                step: i + 1,
                description: `Шифрование символа "${char}"`,
                input: text.slice(0, i + 1),
                result: baconResult,
                details: [
                  `Текущий символ: ${char}`,
                  `Язык шифрования: ${language === 'ru' ? 'русский' : 'английский'}`,
                  `Код Бэкона: ${code}`,
                  `Результат: ${baconResult}`
                ],
                animation: true
              });
            } else if (char === ' ') {
              if (currentWord) {
                baconResult = currentWord + ' ';
                steps.push({
                  step: i + 1,
                  description: `Обработка пробела`,
                  input: text.slice(0, i + 1),
                  result: baconResult,
                  details: [
                    `Пробел разделяет слова в шифре Бэкона`,
                    `Язык шифрования: ${language === 'ru' ? 'русский' : 'английский'}`
                  ],
                  animation: false
                });
                currentWord = '';
              }
            } else {
              currentWord += char;
              baconResult = currentWord;
              
              steps.push({
                step: i + 1,
                description: `Символ "${char}" не изменяется`,
                input: text.slice(0, i + 1),
                result: baconResult,
                details: [
                  `Символ "${char}" не входит в алфавит и остается без изменений`,
                  `Язык шифрования: ${language === 'ru' ? 'русский' : 'английский'}`
                ],
                animation: false
              });
            }
          }
        } else {
          const words = text.trim().split(' ');
          
          for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
            const word = words[wordIndex];
            
            if (wordIndex > 0) {
              baconResult += ' ';
              steps.push({
                step: wordIndex + 1,
                description: `Обработка пробела между словами`,
                input: words.slice(0, wordIndex + 1).join(' '),
                result: baconResult,
                details: [
                  `Пробел между зашифрованными словами расшифровывается как пробел`,
                  `Язык расшифровки: ${language === 'ru' ? 'русский' : 'английский'}`
                ],
                animation: false
              });
            }
            
            for (let i = 0; i < word.length; i += 5) {
              const chunk = word.substring(i, i + 5);
              
              if (chunk.length === 5 && reverseBaconCodes[chunk]) {
                const decodedChar = reverseBaconCodes[chunk];
                baconResult += decodedChar;
                
                steps.push({
                  step: (wordIndex * 100) + (i / 5) + 1,
                  description: `Расшифровка кода "${chunk}"`,
                  input: words.slice(0, wordIndex + 1).join(' '),
                  result: baconResult,
                  details: [
                    `Код Бэкона: ${chunk}`,
                    `Язык расшифровки: ${language === 'ru' ? 'русский' : 'английский'}`,
                    `Соответствует букве: ${decodedChar}`
                  ],
                  animation: true
                });
              } else if (chunk) {
                baconResult += chunk;
                
                steps.push({
                  step: (wordIndex * 100) + (i / 5) + 1,
                  description: `Символы "${chunk}" не распознаны`,
                  input: words.slice(0, wordIndex + 1).join(' '),
                  result: baconResult,
                  details: [
                    `Фрагмент "${chunk}" не является корректным кодом Бэкона`,
                    `Язык расшифровки: ${language === 'ru' ? 'русский' : 'английский'}`,
                    `Оставляем без изменений`
                  ],
                  animation: false
                });
              }
            }
          }
        }
        break;
      
      case 'vigenere':
        if (!key) return [];
        
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
        
      case 'a1z26':
        const EN_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const RU_ALPHABET = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
        const alphabet = language === 'en' ? EN_ALPHABET : RU_ALPHABET;
        
        let a1z26Result = '';
        let isFirstWord = true;
        
        if (isEncryption) {
          for (let i = 0; i < text.length; i++) {
            const char = text[i].toUpperCase();
            const index = alphabet.indexOf(char);
            
            if (index !== -1) {
              const numberRepresentation = (index + 1).toString();
              
              if (isFirstWord) {
                a1z26Result += numberRepresentation;
                isFirstWord = false;
              } else {
                a1z26Result += ' ' + numberRepresentation;
              }
              
              steps.push({
                step: i + 1,
                description: `Шифрование символа "${char}"`,
                input: text.slice(0, i + 1),
                result: a1z26Result,
                details: [
                  `Текущий символ: ${char}`,
                  `Позиция в ${language === 'en' ? 'английском' : 'русском'} алфавите: ${index + 1}`,
                  `Результат: ${numberRepresentation}`
                ],
                animation: true
              });
            } else if (text[i] === ' ') {
              a1z26Result += ' ';
              isFirstWord = true;
              
              steps.push({
                step: i + 1,
                description: `Обработка пробела`,
                input: text.slice(0, i + 1),
                result: a1z26Result,
                details: [
                  `Пробел сохраняется для разделения слов`
                ],
                animation: false
              });
            } else {
              a1z26Result += text[i];
              isFirstWord = false;
              
              steps.push({
                step: i + 1,
                description: `Символ "${text[i]}" не изменяется`,
                input: text.slice(0, i + 1),
                result: a1z26Result,
                details: [`Символ "${text[i]}" не является буквой и остается без изменений`],
                animation: false
              });
            }
          }
        } else {
          let currentNumber = '';
          
          for (let i = 0; i < text.length; i++) {
            const char = text[i];
            
            if (char >= '0' && char <= '9') {
              currentNumber += char;
              
              steps.push({
                step: i + 1,
                description: `Сбор числа: ${currentNumber}`,
                input: text.slice(0, i + 1),
                result: a1z26Result,
                details: [
                  `Текущее накопленное число: ${currentNumber}`,
                  `Ожидаем окончания числа...`
                ],
                animation: false
              });
            } else {
              if (currentNumber) {
                const index = parseInt(currentNumber) - 1;
                if (index >= 0 && index < alphabet.length) {
                  const letter = alphabet[index];
                  a1z26Result += letter;
                  
                  steps.push({
                    step: i,
                    description: `Расшифровка числа ${currentNumber}`,
                    input: text.slice(0, i),
                    result: a1z26Result,
                    details: [
                      `Число ${currentNumber} соответствует позиции ${index + 1} в ${language === 'en' ? 'английском' : 'русском'} алфавите`,
                      `Результат: буква "${letter}"`
                    ],
                    animation: true
                  });
                } else {
                  a1z26Result += '?';
                  
                  steps.push({
                    step: i,
                    description: `Ошибка расшифровки числа ${currentNumber}`,
                    input: text.slice(0, i),
                    result: a1z26Result,
                    details: [
                      `Число ${currentNumber} выходит за пределы алфавита`,
                      `Результат: символ "?"`
                    ],
                    animation: false
                  });
                }
                currentNumber = '';
              }
              
              if (char === '/' || char === ' ') {
                if (a1z26Result.length > 0 && a1z26Result[a1z26Result.length - 1] !== ' ') {
                  a1z26Result += ' ';
                  
                  steps.push({
                    step: i + 1,
                    description: `Обработка разделителя`,
                    input: text.slice(0, i + 1),
                    result: a1z26Result,
                    details: [
                      `Символ "${char}" является разделителем`,
                      `Добавляем пробел для разделения слов`
                    ],
                    animation: false
                  });
                }
              } else {
                a1z26Result += char;
                
                steps.push({
                  step: i + 1,
                  description: `Символ "${char}" не изменяется`,
                  input: text.slice(0, i + 1),
                  result: a1z26Result,
                  details: [`Символ "${char}" не является числом и остается без изменений`],
                  animation: false
                });
              }
            }
          }
          
          if (currentNumber) {
            const index = parseInt(currentNumber) - 1;
            if (index >= 0 && index < alphabet.length) {
              const letter = alphabet[index];
              a1z26Result += letter;
              
              steps.push({
                step: text.length,
                description: `Расшифровка последнего числа ${currentNumber}`,
                input: text,
                result: a1z26Result,
                details: [
                  `Число ${currentNumber} соответствует позиции ${index + 1} в ${language === 'en' ? 'английском' : 'русском'} алфавите`,
                  `Результат: буква "${letter}"`
                ],
                animation: true
              });
            } else {
              a1z26Result += '?';
              
              steps.push({
                step: text.length,
                description: `Ошибка расшифровки последнего числа ${currentNumber}`,
                input: text,
                result: a1z26Result,
                details: [
                  `Число ${currentNumber} выходит за пределы алфавита`,
                  `Результат: символ "?"`
                ],
                animation: false
              });
            }
          }
        }
        break;
    }
    
    return steps;
  };

  const renderCipherInfoModal = () => {
    if (!isInfoModalOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
        <style>{stepAnimation}</style>
        <div className={`rounded-xl p-4 md:p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto ${
          isDarkMode 
            ? 'glassmorphism-dark border border-purple-500/20' 
            : 'glassmorphism-light border border-indigo-500/20'
        } shadow-2xl transform transition-all ease-out duration-300`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className={`text-xl md:text-2xl font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-800'
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
                className={`flex items-center space-x-1 md:space-x-2 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                  isDarkMode 
                    ? 'bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 hover:scale-105'
                    : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200 hover:scale-105'
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
                className={`p-2 rounded-full transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/70 hover:text-gray-300' 
                    : 'bg-gray-200/70 text-gray-500 hover:bg-gray-300/80 hover:text-gray-700'
                }`}
              >
                <X className="h-5 w-5 md:h-6 md:w-6" />
              </button>
            </div>
          </div>

          {!showEncryptionSteps ? (
            <div className="grid grid-cols-1 gap-6">
              <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0">
                <div className="w-full md:w-1/3 flex-shrink-0">
                  <div className={`aspect-w-1 aspect-h-1 rounded-xl overflow-hidden border ${
                    isDarkMode ? 'border-purple-500/20' : 'border-indigo-200'
                  } shadow-lg`}>
                    <img 
                      src={CIPHER_INFO[algorithm].creatorImage} 
                      alt={CIPHER_INFO[algorithm].creatorName}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className={`text-center mt-3 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    <span className="font-medium text-base">{CIPHER_INFO[algorithm].creatorName}</span>
                  </div>
                </div>
                
                <div className="w-full md:w-2/3 space-y-4">
                  <div className={`rounded-xl p-5 ${
                    isDarkMode 
                      ? 'bg-gray-800/40 border border-purple-500/10' 
                      : 'bg-white/80 border border-indigo-100'
                  }`}>
                    <h4 className={`text-lg font-semibold mb-2 ${
                      isDarkMode ? 'text-indigo-300' : 'text-indigo-700'
                    }`}>История</h4>
                    <p className={`text-sm leading-relaxed ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>{CIPHER_INFO[algorithm].history}</p>
                  </div>

                  <div className={`rounded-xl p-5 ${
                    isDarkMode 
                      ? 'bg-gray-800/40 border border-purple-500/10' 
                      : 'bg-white/80 border border-indigo-100'
                  }`}>
                    <h4 className={`text-lg font-semibold mb-2 ${
                      isDarkMode ? 'text-indigo-300' : 'text-indigo-700'
                    }`}>Описание метода</h4>
                    <p className={`text-sm leading-relaxed ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>{CIPHER_INFO[algorithm].description}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className={`p-5 rounded-xl ${
              isDarkMode 
                ? 'bg-gray-800/40 border border-purple-500/10' 
                : 'bg-white/80 border border-indigo-100'
            }`}>
              <div className="flex justify-between items-center mb-4">
                <h4 className={`text-lg font-semibold ${
                  isDarkMode ? 'text-indigo-300' : 'text-indigo-700'
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
                    className={`flex-1 px-4 py-3 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-gray-900/50 border-purple-500/20 text-white placeholder-gray-500'
                        : 'bg-white border-indigo-200 text-gray-900 placeholder-gray-400'
                    } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                  />
                  {algorithm !== 'atbash' && algorithm !== 'a1z26' && (
                    <input
                      type="text"
                      value={key}
                      onChange={(e) => {
                        const newKey = e.target.value;
                        setKey(newKey);
                      }}
                      placeholder={algorithm === 'caesar' ? 'Сдвиг' : 'Ключ'}
                      className={`w-24 md:w-32 px-4 py-3 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-gray-900/50 border-purple-500/20 text-white placeholder-gray-500'
                          : 'bg-white border-indigo-200 text-gray-900 placeholder-gray-400'
                      } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                    />
                  )}
                </div>

                <button
                  onClick={() => setEncryptionSteps(generateSteps(input, currentView !== 'decrypt'))}
                  className={`w-full py-3 rounded-lg font-medium transition-all transform active:scale-95 ${
                    isDarkMode 
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-purple-500/20'
                      : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:shadow-lg hover:shadow-indigo-500/20'
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
                        className={`p-4 rounded-xl ${
                          isDarkMode 
                            ? 'bg-gray-900/60 border border-purple-500/10' 
                            : 'bg-white border border-indigo-100'
                        } shadow-sm step-appear`}
                        style={{
                          animationDelay: `${index * 0.1}s`,
                          opacity: 0
                        }}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <span className={`font-medium text-lg ${
                            isDarkMode ? 'text-purple-400' : 'text-purple-600'
                          }`}>Шаг {step.step}</span>
                          <span className="text-sm opacity-75">{step.description}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className={`p-4 rounded-lg ${
                              isDarkMode 
                                ? 'bg-gray-800/50 border border-purple-500/10' 
                                : 'bg-indigo-50 border border-indigo-100'
                            }`}>
                              <div className="text-sm font-medium mb-1">Входные данные</div>
                              <div className="font-mono break-all">{step.input}</div>
                            </div>
                            
                            {step.key && algorithm !== 'a1z26' && (
                              <div className={`p-4 rounded-lg ${
                                isDarkMode 
                                  ? 'bg-gray-800/50 border border-purple-500/10' 
                                  : 'bg-indigo-50 border border-indigo-100'
                              }`}>
                                <div className="text-sm font-medium mb-1">Ключ</div>
                                <div className="font-mono break-all">{step.key}</div>
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <div className={`p-4 rounded-lg ${
                              isDarkMode 
                                ? 'bg-gray-800/50 border border-purple-500/10' 
                                : 'bg-indigo-50 border border-indigo-100'
                            }`}>
                              <div className="text-sm font-medium mb-1">Результат</div>
                              <div className="font-mono break-all">{step.result}</div>
                            </div>

                            <div className={`p-4 rounded-lg ${
                              isDarkMode 
                                ? 'bg-gray-800/50 border border-purple-500/10' 
                                : 'bg-indigo-50 border border-indigo-100'
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
          <div className={`h-full relative ${isDarkMode ? 'bg-mesh' : 'bg-mesh-light'}`}>
            <div className="absolute inset-0 backdrop-blur-md"></div>
            {renderHomePageParticles()}
            <div className="relative z-10 flex flex-col items-center justify-center h-full p-8 space-y-10">
              <div className="text-center space-y-4 max-w-xl fade-in">
                <div className="mb-6">
                  <div className="inline-block p-3 rounded-2xl bg-gradient-primary floating">
                    <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
                      <Lock className={`w-10 h-10 ${isDarkMode ? 'text-white' : 'text-gray-900'}`} />
                    </div>
                  </div>
                </div>
                <h1 className={`text-3xl md:text-4xl font-bold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Добро пожаловать в <span className="gradient-text">CipherBase</span></h1>
                <p className={`text-lg max-w-lg mx-auto ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                } appear-3d`} style={{animationDelay: '0.3s'}}>
                  Мощный инструмент для шифрования и дешифрования с поддержкой искусственного интеллекта. Включает шифры Виженера, Атбаш, Цезаря и A1Z26.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
                <div 
                  onMouseEnter={() => setCardHover('encrypt')}
                  onMouseLeave={() => setCardHover(null)}
                  onMouseMove={handleMouseMove}
                  onMouseOut={resetTransform}
                  onClick={() => handleViewChange('encrypt')} 
                  className={`p-6 rounded-2xl transition-all duration-300 cursor-pointer transform ${
                    cardHover === 'encrypt' ? 'scale-[1.02]' : ''
                  } ${
                    isDarkMode 
                      ? 'glassmorphism-dark border border-indigo-400/10 hover:border-indigo-400/30' 
                      : 'glassmorphism-light border border-indigo-200 hover:border-indigo-300'
                  } shadow-xl appear-3d`}
                  style={{animationDelay: '0.4s'}}
                >
                  <div className={`p-3 rounded-xl mb-4 inline-block ${
                    isDarkMode 
                      ? 'bg-indigo-900/30 border border-indigo-800/50' 
                      : 'bg-indigo-100 border border-indigo-200'
                  } floating-sideways`}>
                    <Lock className={`w-8 h-8 ${
                      isDarkMode ? 'text-indigo-400' : 'text-indigo-600'
                    }`} />
                  </div>
                  <h3 className={`text-xl font-bold mb-2 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>Зашифровать</h3>
                  <p className={`text-base ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>Защитите ваши сообщения с помощью различных методов шифрования</p>
                </div>
                
                <div 
                  onMouseEnter={() => setCardHover('decrypt')}
                  onMouseLeave={() => setCardHover(null)}
                  onMouseMove={handleMouseMove}
                  onMouseOut={resetTransform}
                  onClick={() => handleViewChange('decrypt')} 
                  className={`p-6 rounded-2xl transition-all duration-300 cursor-pointer transform ${
                    cardHover === 'decrypt' ? 'scale-[1.02]' : ''
                  } ${
                    isDarkMode 
                      ? 'glassmorphism-dark border border-purple-400/10 hover:border-purple-400/30' 
                      : 'glassmorphism-light border border-purple-200 hover:border-purple-300'
                  } shadow-xl appear-3d`}
                  style={{animationDelay: '0.6s'}}
                >
                  <div className={`p-3 rounded-xl mb-4 inline-block ${
                    isDarkMode 
                      ? 'bg-purple-900/30 border border-purple-800/50' 
                      : 'bg-purple-100 border border-purple-200'
                  } floating`}>
                    <Unlock className={`w-8 h-8 ${
                      isDarkMode ? 'text-purple-400' : 'text-purple-600'
                    }`} />
                  </div>
                  <h3 className={`text-xl font-bold mb-2 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>Расшифровать</h3>
                  <p className={`text-base ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>Расшифруйте сообщения с помощью AI-анализа</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'encrypt':
      case 'decrypt':
        return (
          <div className={`max-w-4xl mx-auto py-10 px-4 space-y-8 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            <h2 className="text-2xl md:text-3xl font-bold mb-8 fade-in">
              {currentView === 'encrypt' ? 'Шифрование' : 'Расшифровка'} <span className="gradient-text">текста</span>
            </h2>
            
            {currentView === 'decrypt' && (
              <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0 mb-6 fade-in">
                <button
                  onClick={() => handleDecryptModeChange('universal')}
                  onMouseEnter={() => setButtonHover('universal')}
                  onMouseLeave={() => setButtonHover(null)}
                  className={`flex-1 flex items-center justify-center space-x-3 px-4 py-4 rounded-xl transition-all duration-300 ripple btn-wave ${
                    decryptMode === 'universal'
                      ? isDarkMode
                        ? 'bg-gradient-primary text-white border border-indigo-500/40 shadow-lg shadow-indigo-500/10'
                        : 'bg-gradient-primary text-white shadow-lg shadow-indigo-500/20'
                      : isDarkMode
                        ? 'bg-gray-800/60 text-gray-300 hover:bg-gray-800/80 border border-gray-700'
                        : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md border border-gray-200'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <div className="flex items-center space-x-2 mb-1">
                      <RefreshCw className={`w-5 h-5 ${buttonHover === 'universal' ? 'spin' : ''}`} />
                      <span className="font-bold">AI Расшифровка</span>
                    </div>
                    <span className="text-xs opacity-75">Автоматический подбор метода</span>
                  </div>
                </button>
                <button
                  onClick={() => handleDecryptModeChange('known')}
                  onMouseEnter={() => setButtonHover('known')}
                  onMouseLeave={() => setButtonHover(null)}
                  className={`flex-1 flex items-center justify-center space-x-3 px-4 py-4 rounded-xl transition-all duration-300 ripple btn-wave ${
                    decryptMode === 'known'
                      ? isDarkMode
                        ? 'bg-gradient-primary text-white border border-indigo-500/40 shadow-lg shadow-indigo-500/10'
                        : 'bg-gradient-primary text-white shadow-lg shadow-indigo-500/20'
                      : isDarkMode
                        ? 'bg-gray-800/60 text-gray-300 hover:bg-gray-800/80 border border-gray-700'
                        : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md border border-gray-200'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <div className="flex items-center space-x-2 mb-1">
                      <Lock className={`w-5 h-5 ${buttonHover === 'known' ? 'bounce' : ''}`} />
                      <span className="font-bold">Известный шифр</span>
                    </div>
                    <span className="text-xs opacity-75">Выбор конкретного метода</span>
                  </div>
                </button>
              </div>
            )}

            {(currentView === 'encrypt' || (currentView === 'decrypt' && decryptMode === 'known')) && (
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-8">
                {(['vigenere', 'atbash', 'caesar', 'a1z26', 'bacon'] as Algorithm[]).map((alg, index) => (
                  <div key={alg} className="relative group flip-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    <button
                      onClick={() => handleAlgorithmChange(alg)}
                      onMouseEnter={() => setHoveredElement(alg)}
                      onMouseLeave={() => setHoveredElement(null)}
                      className={`w-full h-full flex flex-col items-center justify-center p-5 rounded-xl transition-all duration-300 ${
                        algorithm === alg
                          ? isDarkMode
                            ? 'bg-gradient-primary text-white border border-indigo-500/40'
                            : 'bg-gradient-primary text-white shadow-md'
                          : isDarkMode
                            ? 'bg-gray-800/60 text-gray-300 hover:bg-gray-800/80 border border-gray-700 hover:border-gray-600'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow'
                      } ${hoveredElement === alg ? 'breathe' : ''}`}
                    >
                      <div className="text-lg font-bold mb-1 capitalize">{CIPHER_INFO[alg].name}</div>
                      <div 
                        className={`absolute top-0 right-0 mt-2 mr-2 px-2 py-1 text-xs rounded-full ${
                          algorithm === alg
                            ? 'bg-white/20 text-white'
                            : isDarkMode
                              ? 'bg-gray-700 text-gray-300'
                              : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {alg === 'vigenere' ? 'Виж.' : alg === 'atbash' ? 'Атб.' : alg === 'caesar' ? 'Цез.' : 'A1Z26'}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsInfoModalOpen(true);
                        }}
                        className={`mt-2 px-3 py-1 rounded-full text-xs flex items-center space-x-1 transition-colors ${
                          algorithm === alg
                            ? 'bg-white/20 hover:bg-white/30 text-white'
                            : isDarkMode
                              ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                        }`}
                      >
                        <HelpCircle className="w-3 h-3" />
                        <span>Инфо</span>
                      </button>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-6 fade-in" style={{animationDelay: '0.2s'}}>
              <div className="space-y-2">
                <label className={`block text-base font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>{currentView === 'encrypt' ? 'Исходный текст' : 'Зашифрованный текст'}</label>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={currentView === 'encrypt' ? 
                    "Введите текст для шифрования..." : 
                    "Введите текст для расшифровки..."}
                  className={`w-full h-36 p-4 rounded-xl border focus:ring-2 focus:outline-none transition-all ${
                    isDarkMode 
                      ? 'bg-gray-900/70 border-gray-700 text-white placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                />
              </div>
              
              {(currentView === 'encrypt' || (currentView === 'decrypt' && decryptMode === 'known')) && (algorithm === 'a1z26' || algorithm === 'bacon') && (
                <div className="space-y-2">
                  <label className={`block text-base font-medium ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Выбор языка
                  </label>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setLanguage('ru')}
                      className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                        language === 'ru'
                          ? isDarkMode
                            ? 'bg-gradient-primary text-white border border-indigo-500/40'
                            : 'bg-gradient-primary text-white shadow-md'
                          : isDarkMode
                            ? 'bg-gray-800/60 text-gray-300 hover:bg-gray-800/80 border border-gray-700'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm'
                      }`}
                    >
                      Русский (А-Я)
                    </button>
                    <button
                      onClick={() => setLanguage('en')}
                      className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                        language === 'en'
                          ? isDarkMode
                            ? 'bg-gradient-primary text-white border border-indigo-500/40'
                            : 'bg-gradient-primary text-white shadow-md'
                          : isDarkMode
                            ? 'bg-gray-800/60 text-gray-300 hover:bg-gray-800/80 border border-gray-700'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm'
                      }`}
                    >
                      English (A-Z)
                    </button>
                  </div>
                </div>
              )}
              
              {(currentView === 'encrypt' || (currentView === 'decrypt' && decryptMode === 'known')) && algorithm !== 'atbash' && algorithm !== 'a1z26' && algorithm !== 'bacon' && (
                <div className="space-y-2">
                  <label className={`block text-base font-medium ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {algorithm === 'caesar' ? 'Сдвиг' : 'Ключ шифрования'}
                  </label>
                  <input
                    type="text"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder={algorithm === 'caesar' ? 'Введите число сдвига' : 'Введите ключ шифрования'}
                    className={`w-full p-4 rounded-xl border focus:ring-2 focus:outline-none transition-all ${
                      isDarkMode 
                        ? 'bg-gray-900/70 border-gray-700 text-white placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500'
                    }`}
                  />
                </div>
              )}

              <div className="button-container pt-2">
                <button
                  onClick={currentView === 'encrypt' ? handleEncrypt : (decryptMode === 'universal' ? handleDecrypt : handleDecryptWithKey)}
                  disabled={isLoading || isProcessing}
                  className={`w-full py-4 rounded-xl font-bold text-white transition-all transform active:scale-98 ${
                    (isLoading || isProcessing) ? 'opacity-75 cursor-not-allowed' : ''
                  } bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg hover:shadow-indigo-600/20`}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="animate-spin w-5 h-5 inline mr-2" />
                      <span>Обработка...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 inline mr-2" />
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
              <div className={`space-y-3 rounded-xl p-5 fade-in transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-gray-800/70 border border-indigo-500/20' 
                  : 'bg-white shadow-lg border border-indigo-100'
              }`} style={{animationDelay: '0.3s'}}>
                <div className="flex justify-between items-center">
                  <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Результат</h3>
                  <button
                    onClick={handleCopy}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-700/70 text-gray-300 hover:bg-gray-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Copy className="w-4 h-4" />
                    <span className="text-sm font-medium">{copyStatus}</span>
                  </button>
                </div>
                <div className={`p-4 rounded-lg break-all ${
                  isDarkMode 
                    ? 'bg-gray-900/70 border border-gray-700' 
                    : 'bg-gray-50 border border-gray-200'
                }`}>
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
      <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className={`rounded-xl p-6 max-w-2xl w-full space-y-6 transform transition-all duration-300 ease-out ${
          isDarkMode 
            ? 'glassmorphism-dark border border-yellow-500/20' 
            : 'glassmorphism-light border border-yellow-200'
        } shadow-2xl`}>
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${
                isDarkMode ? 'bg-yellow-600/20' : 'bg-yellow-100'
              }`}>
                <HelpCircle className={`w-6 h-6 ${
                  isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                }`} />
              </div>
              <h3 className={`text-xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Важное уведомление
              </h3>
            </div>
            <button
              onClick={() => {
                setShowAIWarning(false);
                setPendingDecryption(false);
              }}
              className={`p-2 rounded-full transition-colors ${
                isDarkMode 
                  ? 'bg-gray-800/70 text-gray-400 hover:bg-gray-700/70 hover:text-gray-300' 
                  : 'bg-gray-200/70 text-gray-500 hover:bg-gray-300/80 hover:text-gray-700'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className={`space-y-4 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            <p className="font-medium text-base">
              Функция дешифровки с использованием ИИ предназначена исключительно для образовательных и исследовательских целей. Используя эту функцию, вы подтверждаете, что понимаете и принимаете следующие условия:
            </p>
            <ul className="space-y-3">
              {[
                'Вы будете использовать функцию ИИ исключительно в законных и этичных целях.',
                'Вы осознаете, что результаты дешифровки ИИ могут быть неточными и не гарантируют 100% успеха.',
                'Вы принимаете на себя полную ответственность за использование полученной информации и понимаете, что администрация сайта не несет ответственности за последствия.',
                'Вы соглашаетесь не использовать функцию ИИ для расшифровки информации, полученной незаконным путем, или для любых противоправных действий.'
              ].map((item, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 p-1 rounded mt-0.5 ${
                    isDarkMode ? 'bg-indigo-500/20' : 'bg-indigo-100'
                  }`}>
                    <svg className={`w-3 h-3 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-end space-x-4 pt-2">
            <button
              onClick={() => {
                setShowAIWarning(false);
                setPendingDecryption(false);
              }}
              className={`px-5 py-3 rounded-xl font-medium transition-all transform active:scale-95 ${
                isDarkMode 
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-300'
              }`}
            >
              Отмена
            </button>
            <button
              onClick={handleAcceptAITerms}
              className="px-5 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg hover:shadow-indigo-600/20 transition-all transform active:scale-95"
            >
              Принимаю условия
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderHomePageParticles = () => {
    if (!showParticles || animationPreference === 'low') return null;
    
    return (
      <div className="particle-container">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        
        <div className="blur-circle blur-circle-1"></div>
        <div className="blur-circle blur-circle-2"></div>
        <div className="blur-circle blur-circle-3"></div>
      </div>
    );
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (animationPreference === 'low') return;
    
    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top; 
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const percentX = (x - centerX) / centerX * 10;
    const percentY = (y - centerY) / centerY * 10;
    
    el.style.transform = `perspective(1000px) rotateY(${percentX}deg) rotateX(${-percentY}deg)`;
  };
  
  const resetTransform = (event: React.MouseEvent<HTMLDivElement>) => {
    event.currentTarget.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg)';
  };

  return (
    <div className={`flex min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <style>{animations}</style>
      <style>{thinkingAnimation}</style>
      <style>{styles}</style>
      <style>{lightbulbAnimation}</style>
      <style>{stepAnimation}</style>
      <style>{particles}</style>
      
      {isMobile && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className={`fixed top-4 left-4 z-50 p-3 rounded-xl backdrop-blur-md ${
            isDarkMode 
              ? 'bg-gray-800/70 text-gray-200 border border-gray-700/50' 
              : 'bg-white/80 text-gray-800 shadow-lg border border-gray-200'
          }`}
        >
          <Menu className="w-6 h-6" />
        </button>
      )}

      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      <div className={`${
        isMobile 
          ? `fixed top-0 left-0 bottom-0 z-50 transform transition-transform duration-300 ease-in-out ${
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`
          : 'relative'
      } w-72 flex flex-col ${
        isDarkMode 
          ? 'glassmorphism-dark border-r border-gray-700/50' 
          : 'glassmorphism-light border-r border-gray-200'
      }`}>
        
        {isMobile && (
          <button
            onClick={() => setIsSidebarOpen(false)}
            className={`absolute top-4 right-4 p-2 rounded-full ${
              isDarkMode 
                ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300' 
                : 'bg-gray-200 text-gray-500 hover:bg-gray-300 hover:text-gray-700'
            }`}
          >
            <X className="w-6 h-6" />
          </button>
        )}

        <div className={`p-5 border-b ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200'}`}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>CipherBase</h1>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Шифрование с ИИ</p>
            </div>
          </div>
        </div>
        
        <nav className="p-4 space-y-2">
          {[
            { view: 'home', icon: <Home className="w-5 h-5" />, label: 'Главная' },
            { view: 'encrypt', icon: <Lock className="w-5 h-5" />, label: 'Зашифровать' },
            { view: 'decrypt', icon: <Unlock className="w-5 h-5" />, label: 'Расшифровать' }
          ].map((item) => (
            <button
              key={item.view}
              onClick={() => handleViewChange(item.view as View)}
              onMouseEnter={() => setIsMenuItemHovered(item.view)}
              onMouseLeave={() => setIsMenuItemHovered(null)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm transition-all duration-300 ${
                currentView === item.view
                  ? isDarkMode 
                    ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/30 text-white font-medium border border-indigo-500/30'
                    : 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 font-medium border border-indigo-200'
                  : isDarkMode 
                    ? `text-gray-300 hover:bg-gray-800/50 ${isMenuItemHovered === item.view ? 'bg-gray-800/30' : ''}`
                    : `text-gray-700 hover:bg-gray-100 ${isMenuItemHovered === item.view ? 'bg-gray-50' : ''}`
              }`}
            >
              <div className={`${
                currentView === item.view
                  ? isDarkMode ? 'text-indigo-400' : 'text-indigo-600'
                  : ''
              }`}>
                {item.icon}
              </div>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="px-4 flex-1 overflow-hidden">
          <div className={`pt-4 ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200'}`}>
            <div className={`flex items-center space-x-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
              <History className="w-4 h-4" />
              <span className="font-medium">История операций</span>
            </div>
            <div className="space-y-2 overflow-y-auto h-[calc(100vh-400px)] pr-2 custom-scrollbar">
              {recentOperations.map((op, index) => (
                <div
                  key={op.id}
                  className={`p-3 rounded-xl text-sm relative group transition-all ${
                    isDarkMode 
                      ? 'bg-gray-800/60 hover:bg-gray-800/90 border border-gray-700/50' 
                      : 'bg-white hover:bg-gray-50 border border-gray-200 shadow-sm'
                  } ${index === 0 ? 'fade-in' : ''}`}
                >
                  <div 
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedOperation(op);
                      setIsModalOpen(true);
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2 min-w-0">
                        <div className={`p-1.5 rounded-md ${
                          op.type === 'encrypt'
                            ? isDarkMode ? 'bg-indigo-800/40 text-indigo-400' : 'bg-indigo-100 text-indigo-600'
                            : isDarkMode ? 'bg-purple-800/40 text-purple-400' : 'bg-purple-100 text-purple-600'
                        }`}>
                          {op.type === 'encrypt' ? (
                            <Lock className="w-3.5 h-3.5" />
                          ) : (
                            <Unlock className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <span className={`truncate font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {op.text.slice(0, 15)}{op.text.length > 15 ? '...' : ''}
                        </span>
                      </div>
                      {op.algorithm && (
                        <span className={`text-xs capitalize flex-shrink-0 ml-2 px-2 py-0.5 rounded-full ${
                          isDarkMode ? 'bg-gray-700/60 text-gray-300' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {op.algorithm}
                        </span>
                      )}
                    </div>
                    <div className={`text-xs truncate mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {op.result.slice(0, 30)}{op.result.length > 30 ? '...' : ''}
                    </div>
                    <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {new Date(op.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteOperation(op.id);
                    }}
                    className={`absolute -top-2 -right-2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow ${
                      isDarkMode 
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-gray-300' 
                        : 'bg-white hover:bg-gray-100 text-gray-500 hover:text-gray-700 border border-gray-200'
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {recentOperations.length === 0 && (
                <div className={`text-sm text-center py-5 rounded-xl ${
                  isDarkMode ? 'text-gray-500 bg-gray-800/30' : 'text-gray-500 bg-gray-50'
                }`}>
                  Нет недавних операций
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={`p-4 border-t ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200'}`}>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className={`w-full flex items-center justify-center space-x-2 px-4 py-3 text-sm rounded-xl transition-all ${
              isDarkMode 
                ? 'bg-gray-800/60 text-gray-300 hover:bg-gray-800/90 border border-gray-700/50' 
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Настройки</span>
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
          className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center p-4 z-50 fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsModalOpen(false);
            }
          }}
        >
          <div 
            className={`rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-500 ease-out pop-in ${
              isDarkMode 
                ? 'glassmorphism-dark border border-indigo-500/20' 
                : 'glassmorphism-light border border-indigo-200'
            } shadow-2xl`}
          >
            <div className="flex justify-between items-center">
              <h3 className={`text-xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Детали операции
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className={`p-2 rounded-full transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-800/70 text-gray-400 hover:bg-gray-700/70 hover:text-gray-300' 
                    : 'bg-gray-200/70 text-gray-500 hover:bg-gray-300/80 hover:text-gray-700'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-5 mt-5">
              <div>
                <label className={`block text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Тип операции</label>
                <div className={`mt-2 flex items-center space-x-2 p-3 rounded-lg ${
                  isDarkMode 
                    ? 'bg-gray-800/50 border border-gray-700' 
                    : 'bg-white border border-gray-200'
                }`}>
                  <div className={`p-2 rounded-md ${
                    selectedOperation.type === 'encrypt'
                      ? isDarkMode ? 'bg-indigo-800/40 text-indigo-400' : 'bg-indigo-100 text-indigo-600'
                      : isDarkMode ? 'bg-purple-800/40 text-purple-400' : 'bg-purple-100 text-purple-600'
                  }`}>
                    {selectedOperation.type === 'encrypt' ? (
                      <Lock className="w-5 h-5" />
                    ) : (
                      <Unlock className="w-5 h-5" />
                    )}
                  </div>
                  <span className={`${isDarkMode ? 'text-white' : 'text-gray-900'} font-medium`}>
                    {selectedOperation.type === 'encrypt' ? 'Шифрование' : 'Расшифровка'}
                  </span>
                </div>
              </div>

              {selectedOperation.algorithm && (
                <div>
                  <label className={`block text-sm font-medium ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>Алгоритм</label>
                  <div className={`mt-2 capitalize p-3 rounded-lg ${
                    isDarkMode 
                      ? 'bg-gray-800/50 border border-gray-700 text-white' 
                      : 'bg-white border border-gray-200 text-gray-900'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <div className={`h-3 w-3 rounded-full ${
                        selectedOperation.algorithm === 'vigenere'
                          ? 'bg-indigo-500'
                          : selectedOperation.algorithm === 'atbash'
                            ? 'bg-purple-500'
                            : 'bg-pink-500'
                      }`}></div>
                      <span>{CIPHER_INFO[selectedOperation.algorithm].name}</span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className={`block text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Исходный текст</label>
                <div className={`mt-2 p-4 rounded-lg break-all ${
                  isDarkMode 
                    ? 'bg-gray-800/50 border border-gray-700 text-white' 
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}>
                  {selectedOperation.text}
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Результат</label>
                <div className={`mt-2 p-4 rounded-lg break-all ${
                  isDarkMode 
                    ? 'bg-gray-800/50 border border-gray-700 text-white' 
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}>
                  {selectedOperation.result}
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Время</label>
                <div className={`mt-2 p-3 rounded-lg ${
                  isDarkMode 
                    ? 'bg-gray-800/50 border border-gray-700 text-white' 
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}>
                  {new Date(selectedOperation.timestamp).toLocaleString()}
                </div>
              </div>

              {selectedOperation.algorithm === 'vigenere' && selectedOperation.key && (
                <div>
                  <label className={`block text-sm font-medium ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>Ключ</label>
                  <div className={`mt-2 p-4 rounded-lg break-all font-mono ${
                    isDarkMode 
                      ? 'bg-gray-800/50 border border-gray-700 text-white' 
                      : 'bg-white border border-gray-200 text-gray-900'
                  }`}>
                    {selectedOperation.key}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className={`px-5 py-3 rounded-xl font-medium transition-all transform hover:scale-105 active:scale-95 ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-gray-700 to-gray-800 text-white hover:shadow-lg hover:shadow-gray-700/20 border border-gray-600'
                    : 'bg-white text-gray-800 hover:shadow-lg hover:shadow-gray-300/50 border border-gray-200'
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
          className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsSettingsOpen(false);
            }
          }}
        >
          <div className={`rounded-xl p-6 max-w-lg w-full space-y-5 transform transition-all duration-300 ease-out ${
            isDarkMode 
              ? 'glassmorphism-dark border border-indigo-500/20' 
              : 'glassmorphism-light border border-indigo-200'
          } shadow-2xl`}>
            <div className="flex justify-between items-center">
              <h3 className={`text-xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Настройки
              </h3>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className={`p-2 rounded-full transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-800/70 text-gray-400 hover:bg-gray-700/70 hover:text-gray-300' 
                    : 'bg-gray-200/70 text-gray-500 hover:bg-gray-300/80 hover:text-gray-700'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-5">
              <div className={`p-4 rounded-xl ${
                isDarkMode 
                  ? 'bg-gray-800/50 border border-gray-700' 
                  : 'bg-white border border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-md ${
                      isDarkMode 
                        ? 'bg-purple-800/40 text-purple-400' 
                        : 'bg-purple-100 text-purple-600'
                    }`}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    </div>
                    <div>
                      <label className={`block font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Темная тема</label>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Изменить оформление приложения</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isDarkMode ? 'bg-indigo-600' : 'bg-gray-300'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>
              </div>
              
              <div className={`p-4 rounded-xl ${
                isDarkMode 
                  ? 'bg-gray-800/50 border border-gray-700' 
                  : 'bg-white border border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-md ${
                      isDarkMode 
                        ? 'bg-indigo-800/40 text-indigo-400' 
                        : 'bg-indigo-100 text-indigo-600'
                    }`}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                      </svg>
                    </div>
                    <div className="relative">
                      <label className={`block font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Использовать букву Ё
                      </label>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Влияет на алгоритмы шифрования
                      </p>
                      
                      <div className="relative group inline-block ml-1">
                        <HelpCircle 
                          className={`w-4 h-4 inline cursor-help ${
                            isDarkMode ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-500'
                          }`}
                        />
                        <div className={`absolute left-1/2 transform -translate-x-1/2 -translate-y-full mb-2 px-3 py-2 text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 ${
                          isDarkMode 
                            ? 'bg-gray-800 text-gray-300 border border-gray-700' 
                            : 'bg-white text-gray-600 border border-gray-200 shadow-lg'
                        }`}>
                          Некоторые шифраторы не используют букву Ё
                          <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 ${
                            isDarkMode 
                              ? 'bg-gray-800 border-r border-b border-gray-700' 
                              : 'bg-white border-r border-b border-gray-200'
                          }`}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setIncludeYo(!includeYo)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${includeYo ? 'bg-indigo-600' : 'bg-gray-300'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${includeYo ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className={`px-5 py-3 rounded-xl font-medium transition-all transform hover:scale-105 active:scale-95 ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:shadow-indigo-600/20'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:shadow-lg hover:shadow-indigo-500/20'
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

function a1z26Encrypt(text: string, lang: Language): string {
  if (!text) return '';
  
  const EN_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const RU_ALPHABET = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
  
  const alphabet = lang === 'en' ? EN_ALPHABET : RU_ALPHABET;
  let result = '';
  let isFirstWord = true;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i].toUpperCase();
    const index = alphabet.indexOf(char);
    
    if (index !== -1) {
      if (isFirstWord) {
        result += (index + 1);
        isFirstWord = false;
      } else {
        result += ' ' + (index + 1);
      }
    } else if (text[i] === ' ') {
      result += ' ';
      isFirstWord = true;
    } else {
      result += text[i];
      isFirstWord = false;
    }
  }
  
  return result;
}

function a1z26Decrypt(text: string, lang: Language): string {
  if (!text) return '';
  
  const EN_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const RU_ALPHABET = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
  
  const alphabet = lang === 'en' ? EN_ALPHABET : RU_ALPHABET;
  let result = '';
  let currentNumber = '';
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    if (char >= '0' && char <= '9') {
      currentNumber += char;
    } else {
      if (currentNumber) {
        const index = parseInt(currentNumber) - 1;
        if (index >= 0 && index < alphabet.length) {
          result += alphabet[index];
        } else {
          result += '?';
        }
        currentNumber = '';
      }
      
      if (char === '/' || char === ' ') {
        if (result.length > 0 && result[result.length - 1] !== ' ') {
          result += ' ';
        }
      } else {
        result += char;
      }
    }
  }
  
  if (currentNumber) {
    const index = parseInt(currentNumber) - 1;
    if (index >= 0 && index < alphabet.length) {
      result += alphabet[index];
    } else {
      result += '?';
    }
  }
  
  return result;
}

const baconEncrypt = (text: string, lang: Language): string => {
  const ruAlphabet = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя';
  const enAlphabet = 'abcdefghijklmnopqrstuvwxyz';
  
  const alphabet = lang === 'ru' ? ruAlphabet : enAlphabet;
  
  const baconCodes: Record<string, string> = {};
  
  for (let i = 0; i < alphabet.length; i++) {
    const binaryCode = i.toString(2).padStart(5, '0').replace(/0/g, 'a').replace(/1/g, 'b');
    baconCodes[alphabet[i]] = binaryCode;
  }
  
  let encrypted = '';
  let currentWord = '';
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i].toLowerCase();
    
    if (alphabet.includes(char)) {
      currentWord += baconCodes[char];
    } else if (char === ' ') {
      encrypted += currentWord + ' ';
      currentWord = '';
    } else {
      currentWord += char;
    }
  }
  
  if (currentWord) {
    encrypted += currentWord;
  }
  
  return encrypted.trim();
};

const baconDecrypt = (text: string, lang: Language): string => {
  const ruAlphabet = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя';
  const enAlphabet = 'abcdefghijklmnopqrstuvwxyz';
  
  const alphabet = lang === 'ru' ? ruAlphabet : enAlphabet;
  
  const baconCodes: Record<string, string> = {};
  
  for (let i = 0; i < alphabet.length; i++) {
    const binaryCode = i.toString(2).padStart(5, '0').replace(/0/g, 'a').replace(/1/g, 'b');
    baconCodes[alphabet[i]] = binaryCode;
  }
  
  const reverseBaconCodes: Record<string, string> = {};
  for (const [char, code] of Object.entries(baconCodes)) {
    reverseBaconCodes[code] = char;
  }
  
  const words = text.trim().split(' ');
  
  let decrypted = '';
  
  for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
    const word = words[wordIndex];
    
    if (wordIndex > 0) {
      decrypted += ' ';
    }
    
    for (let i = 0; i < word.length; i += 5) {
      const chunk = word.substring(i, i + 5);
      
      if (chunk.length === 5 && reverseBaconCodes[chunk]) {
        decrypted += reverseBaconCodes[chunk];
      } else {
        decrypted += chunk;
      }
    }
  }
  
  return decrypted;
};

export default App;
