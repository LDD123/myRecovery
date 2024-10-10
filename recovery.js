import fs from 'fs/promises';  
import bip39 from 'bip39';  
  
// 读取BIP-39单词列表  
async function loadBip39Words() {  
  const data = await fs.readFile('bip39-words.json', 'utf8');  
  return JSON.parse(data);  
}  
  
// 辅助函数：获取以特定首字母开头的所有单词  
function getWordsByStartLetter(wordsList, letter) {  
  return wordsList.filter(word => word.startsWith(letter));  
}  
  
// 辅助函数：递归生成所有可能的组合  
async function generateCombinations(mnemonicParts, index, wordsList) {  
  if (index >= mnemonicParts.length) {  
    return [mnemonicParts.slice()];  
  }  
  
  const currentPart = mnemonicParts[index];  
  if (!currentPart.includes('___')) {  
    return generateCombinations(mnemonicParts, index + 1, wordsList).map(combination => [  
      ...combination, currentPart  
    ]);  
  }  
  
  const startLetter = currentPart[0];  
  const possibleWords = getWordsByStartLetter(wordsList, startLetter);  
  return possibleWords.reduce((combinations, word) => {  
    const newMnemonicParts = [...mnemonicParts];  
    newMnemonicParts[index] = word;  
    return combinations.concat(generateCombinations(newMnemonicParts, index + 1, wordsList));  
  }, []);  
}  
  
// 已知的助记词和遗忘单词的首字母  
const knownMnemonicParts = [  
  'legal', 'winner', 'sunny', 'equip', // 已知的助记词  
  'c___',  // 遗忘的单词，首字母为'c'  
  'm___',  // 遗忘的单词，首字母为'm'  
  't___',  // 遗忘的单词，首字母为't'  
  's___',  // 遗忘的单词，首字母为's'  
  // 剩余的已知助记词（假设你知道它们的位置）  
  'old', 'word', 'pass', 'happy', 'first', 'light', 'zero'  
];  
  
(async () => {  
  try {  
    const wordsList = await loadBip39Words();  
    const allMnemonicCombinations = await generateCombinations(knownMnemonicParts, 0, wordsList);  
  
    // 尝试验证每一个组合  
    for (const combination of allMnemonicCombinations) {  
      const mnemonic = combination.join(' ');  
      try {  
        bip39.validateMnemonic(mnemonic);  
        console.log(`可能的助记词: ${mnemonic}`);  
        // 你可以在这里添加额外的逻辑，比如保存有效的助记词或进一步处理  
      } catch (error) {  
        // 如果助记词无效，则忽略这个组合  
      }  
    }  
  } catch (error) {  
    console.error('发生错误:', error);  
  }  
})();