import fs from 'fs/promises';  
import bip39 from 'bip39';  
import path from 'path'; 
  
// 读取BIP-39单词列表  
async function loadBip39Words() {  
  const data = await fs.readFile('bip39-words.json', 'utf8');  
  return JSON.parse(data);  
}  
  
// 辅助函数：获取以特定首字母开头的所有单词  
function getWordsByStartLetter(wordsList, letter) {  
  return wordsList.filter(word => word.startsWith(letter));  
}  

// 辅助函数：生成所有可能的单词组合  
function* generateCombinations(words, n) {  
  if (n === 0) yield [];  
  else for (let word of words) for (let combo of generateCombinations(words, n - 1)) yield [word, ...combo];  
}  
  
// // 辅助函数：递归生成所有可能的组合  
// async function generateCombinations(mnemonicParts, index, wordsList) {  
//   if (index >= mnemonicParts.length) {  
//     return [mnemonicParts.slice()];  
//   }  
  
//   const currentPart = mnemonicParts[index];  
//   if (!currentPart.includes('___')) {  
//     return generateCombinations(mnemonicParts, index + 1, wordsList).map(combination => [  
//       ...combination, currentPart  
//     ]);  
//   }  
  
//   const startLetter = currentPart[0];  
//   const possibleWords = getWordsByStartLetter(wordsList, startLetter);  
//   return possibleWords.reduce((combinations, word) => {  
//     const newMnemonicParts = [...mnemonicParts];  
//     newMnemonicParts[index] = word;  
//     return combinations.concat(generateCombinations(newMnemonicParts, index + 1, wordsList));  
//   }, []);  
// }  
  
// 已知的助记词和遗忘单词的首字母  
const knownMnemonicParts = [  
  'gate', 'swap', 'soup', 'father', // 已知的助记词  
  'wide',  // 遗忘的单词，首字母为'c'  
  'uncle',  // 遗忘的单词，首字母为'm'  
  'crystal',  // 遗忘的单词，首字母为't'  
  's___',  //'solid',  遗忘的单词，首字母为's'  
  // 剩余的已知助记词（假设你知道它们的位置）  
  'artefact', 'unable', 'fox', 'slot'  
];  
  
(async () => {  


  // 对每个遗忘的首字母，生成所有可能的单词组合  
  const combinations = [];  
  for (let i = 0; i < forgottenLetters.length; i++) {  
      const letter = forgottenLetters[i];  
      const possibleWords = wordlist.filter(word => word.startsWith(letter.toLowerCase()));  
      combinations.push([...generateCombinations(possibleWords, 1)]);  
  }  

  // 笛卡尔积：生成所有组合的组合  
  function* cartesianProduct(arrays) {  
      const result = [[]];  
      for (const array of arrays) {  
          const newResult = [];  
          for (const item of result) {  
              for (const value of array) {  
                  newResult.push([...item, value]);  
              }  
          }  
          result = newResult;  
      }  
      return result;  
  }  

  const allCombinations = Array.from(cartesianProduct(combinations));  

  // 尝试每个组合，检查是否构成有效的助记词  
  for (const combo of allCombinations) {  
      const candidateMnemonic = [...knownWords, ...combo.flat()].join(' ');  
      if (bip39.validateMnemonic(candidateMnemonic)) {  
          console.log('Recovered mnemonic:', candidateMnemonic);  
          // 将恢复的助记词保存到文件  
          await fs.writeFile('recovered-mnemonic.txt', candidateMnemonic, 'utf8');  
          return;  
      }  
  }  



  try {  
    const wordsList = await loadBip39Words();  
    const allMnemonicCombinations = await generateCombinations(knownMnemonicParts, 0, wordsList);  
  
    // 尝试验证每一个组合  
    for (const combination of allMnemonicCombinations) {  
      const mnemonic = combination.join(' ');  
      try {  
        const isValid = bip39.validateMnemonic(mnemonic);  
        if (isValid) {  
            console.log('助记词有效.'); 
            console.log(`可能的助记词: ${mnemonic}`); 
            await fs.writeFile('recoveredMnemonic.txt', mnemonic);   
            process.exit(0); // 找到有效组合后停止搜索 
        } else {  
            console.log('助记词无效');  
        }  
        // 你可以在这里添加额外的逻辑，比如保存有效的助记词或进一步处理  
      } catch (error) {  
        // 如果助记词无效，则忽略这个组合  
      }  
    }  
  } catch (error) {  
    console.error('发生错误:', error);  
  }  
})();


// 尝试恢复助记词  
async function recoverMnemonic() {  
  // 对每个遗忘的首字母，生成所有可能的单词组合  
  const combinations = [];  
  for (let i = 0; i < forgottenLetters.length; i++) {  
      const letter = forgottenLetters[i];  
      const possibleWords = wordlist.filter(word => word.startsWith(letter.toLowerCase()));  
      combinations.push([...generateCombinations(possibleWords, 1)]);  
  }  

  // 笛卡尔积：生成所有组合的组合  
  function* cartesianProduct(arrays) {  
      const result = [[]];  
      for (const array of arrays) {  
          const newResult = [];  
          for (const item of result) {  
              for (const value of array) {  
                  newResult.push([...item, value]);  
              }  
          }  
          result = newResult;  
      }  
      return result;  
  }  

  const allCombinations = Array.from(cartesianProduct(combinations));  

  // 尝试每个组合，检查是否构成有效的助记词  
  for (const combo of allCombinations) {  
      const candidateMnemonic = [...knownWords, ...combo.flat()].join(' ');  
      if (bip39.validateMnemonic(candidateMnemonic)) {  
          console.log('Recovered mnemonic:', candidateMnemonic);  
          // 将恢复的助记词保存到文件  
          await fs.writeFile('recovered-mnemonic.txt', candidateMnemonic, 'utf8');  
          return;  
      }  
  }  

  console.log('No valid mnemonic found.');  
}  