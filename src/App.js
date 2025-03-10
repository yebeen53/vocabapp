import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

function App() {
    const [word, setWord] = useState('');
    const [meaning, setMeaning] = useState('');
    const [vocabList, setVocabList] = useState([]);
    const [incorrectAnswers, setIncorrectAnswers] = useState({});
    const [quizMode, setQuizMode] = useState(false);
    const [quizWord, setQuizWord] = useState(null);
    const [choices, setChoices] = useState([]);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [currentPage, setCurrentPage] = useState('addWord');
    const [isCorrect, setIsCorrect] = useState(false);
    const [usedWords, setUsedWords] = useState([]);  // 출제된 단어를 추적하는 상태
    const [isIncorrectQuiz, setIsIncorrectQuiz] = useState(false);  // 오답 퀴즈 여부 상태

    // 로컬스토리지 저장을 위한 debounce 함수 (1초 후 저장)
    const debounceSaveToLocalStorage = useCallback(() => {
        localStorage.setItem('vocabList', JSON.stringify(vocabList));
        localStorage.setItem('incorrectAnswers', JSON.stringify(incorrectAnswers));
    }, [vocabList, incorrectAnswers]);

    useEffect(() => {
        const savedVocabList = JSON.parse(localStorage.getItem('vocabList')) || [];
        setVocabList(savedVocabList);

        const savedIncorrectAnswers = JSON.parse(localStorage.getItem('incorrectAnswers')) || {};
        setIncorrectAnswers(savedIncorrectAnswers);
    }, []);

    useEffect(() => {
        const timeout = setTimeout(() => {
            debounceSaveToLocalStorage();
        }, 1000);

        return () => clearTimeout(timeout);
    }, [vocabList, incorrectAnswers, debounceSaveToLocalStorage]);

    const handleAddWord = () => {
        if (word && meaning) {
            const newVocabList = [...vocabList, { word, meaning }];
            setVocabList(newVocabList);
            setWord('');
            setMeaning('');
            alert('단어가 추가되었습니다!');
        } else {
            alert('단어와 뜻을 입력해주세요.');
        }
    };

    const handleDeleteWord = (index) => {
        const newVocabList = vocabList.filter((_, i) => i !== index);
        setVocabList(newVocabList);
    };

    const handleDeleteIncorrectAnswer = (word) => {
        const newIncorrectAnswers = { ...incorrectAnswers };
        delete newIncorrectAnswers[word];
        setIncorrectAnswers(newIncorrectAnswers);
    };

    const startQuiz = (useIncorrect = false) => {
        const list = useIncorrect
            ? Object.keys(incorrectAnswers).map(word => ({
                word,
                meaning: incorrectAnswers[word].meaning,
            }))
            : vocabList;

        if (list.length === 0) {
            alert('단어가 없습니다. 먼저 단어를 추가해주세요.');
            return;
        }

        setUsedWords([]);  // 퀴즈 시작 시 출제된 단어 리스트 초기화
        setIsIncorrectQuiz(false);  // 오답 퀴즈 여부 초기화
        nextQuiz(list);    // 퀴즈 시작
        setQuizMode(true);
        setSelectedAnswer(null);
        setIsCorrect(false);
        setCurrentPage('quiz');
    };

    const nextQuiz = (list) => {
        const remainingWords = list.filter(word => !usedWords.includes(word.word));  // 아직 출제되지 않은 단어만 필터링
        if (remainingWords.length === 0) {
            alert('퀴즈를 모두 끝냈습니다!');
            setQuizMode(false);
            return;
        }

        const randomIndex = Math.floor(Math.random() * remainingWords.length);
        const selectedWord = remainingWords[randomIndex];

        setQuizWord(selectedWord);
        setChoices(generateChoices(selectedWord.meaning));
        setUsedWords(prev => [...prev, selectedWord.word]);  // 출제된 단어 추가
    };

    const generateChoices = (correctAnswer) => {
        let choices = [correctAnswer];
        while (choices.length < 4 && vocabList.length >= 4) {
            const randomIndex = Math.floor(Math.random() * vocabList.length);
            const randomMeaning = vocabList[randomIndex].meaning;
            if (!choices.includes(randomMeaning)) {
                choices.push(randomMeaning);
            }
        }
        return shuffleArray(choices);
    };

    const shuffleArray = (array) => {
        return array.sort(() => Math.random() - 0.5);
    };

    const checkAnswer = (selected) => {
        setSelectedAnswer(selected);
        if (selected === quizWord.meaning) {
            setIsCorrect(true);
            alert('정답!');
        } else {
            setIsCorrect(false);
            alert('틀렸습니다.');
            setIncorrectAnswers((prev) => {
                const updated = { ...prev };
                const wordKey = quizWord.word;
                if (updated[wordKey]) {
                    updated[wordKey].count += 1;
                } else {
                    updated[wordKey] = { meaning: quizWord.meaning, count: 1 };
                }
                return updated;
            });
        }
    };

    const nextQuizButton = () => {
        if (quizMode) {
            if (isIncorrectQuiz) {
                nextQuiz(Object.keys(incorrectAnswers).map(word => ({
                    word,
                    meaning: incorrectAnswers[word].meaning,
                })));
            } else {
                nextQuiz(vocabList);
            }
        }
    };

    const startIncorrectQuiz = () => {
        setIsIncorrectQuiz(true);  // 오답 퀴즈 시작
        startQuiz(true);  // 오답 퀴즈로 시작
    };

    return (
        <div
            className="App"
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column',
            }}
        >
            <h1>단어 암기 웹</h1>

            {currentPage !== 'addWord' && (
                <button onClick={() => setCurrentPage('addWord')}>홈으로</button>
            )}

            {currentPage === 'addWord' && (
                <div style={{ textAlign: 'center' }}>
                    <h2>단어 추가</h2>
                    <input
                        type="text"
                        placeholder="단어 입력 (영어)"
                        value={word}
                        onChange={(e) => setWord(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="뜻 입력 (한국어)"
                        value={meaning}
                        onChange={(e) => setMeaning(e.target.value)}
                    />
                    <button onClick={handleAddWord}>단어 추가</button>
                    <button onClick={() => startQuiz(false)}>퀴즈 시작</button>
                    <button onClick={startIncorrectQuiz}>오답 퀴즈</button>
                    <button onClick={() => setCurrentPage('incorrectList')}>오답 리스트</button>
                    <h3>추가된 단어 목록</h3>
                    <ul>
                        {vocabList.map((item, index) => (
                            <li key={index}>
                                {item.word}: {item.meaning}{' '}
                                <button onClick={() => handleDeleteWord(index)}>삭제</button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {currentPage === 'quiz' && quizWord && (
                <div style={{ textAlign: 'center' }}>
                    <h2>퀴즈</h2>
                    <p>{quizWord.word}</p>
                    {choices.map((choice, index) => (
                        <button
                            key={index}
                            onClick={() => checkAnswer(choice)}
                            style={{
                                backgroundColor:
                                    selectedAnswer === choice
                                        ? choice === quizWord.meaning
                                            ? 'green'
                                            : 'red'
                                        : 'white',
                            }}
                        >
                            {choice}
                        </button>
                    ))}
                    {selectedAnswer && <button onClick={nextQuizButton}>다음 문제</button>}
                </div>
            )}

            {currentPage === 'incorrectList' && (
                <div style={{ textAlign: 'center' }}>
                    <h2>오답 리스트</h2>
                    <ul>
                        {Object.entries(incorrectAnswers).map(([word, { meaning, count }], index) => (
                            <li key={index}>
                                {word}: {meaning} (틀린 횟수: {count}){' '}
                                <button onClick={() => handleDeleteIncorrectAnswer(word)}>
                                    삭제
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default App;
