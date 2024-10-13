import fs from 'fs/promises';  
import path from 'path';  
import bip39 from 'bip39';  

// 加载BIP-39词库  
const wordlist = JSON.parse(await fs.readFile('bip39-words.json', 'utf8'));  
  
// 已知的助记词部分（包含顺序和遗忘单词的首字母占位符）  
const knownMnemonicParts = [  
    'gate', 'swap', 'soup', 'father', // 已知的助记词  
    'wide',  // 遗忘的单词，首字母为'c'  
    'unc___',  // 遗忘的单词，首字母为'm'  
    'c___',  //crystal 遗忘的单词，首字母为't'  
    's___',  //'solid',  遗忘的单词，首字母为's'  
    // 剩余的已知助记词（假设你知道它们的位置）  
    'artefact', 'unable', 'fox', 'slot'  
  ];  
  
// 提取遗忘单词的首字母  
const forgottenLetters = knownMnemonicParts  
    .map((word, index) => (word.includes('___') ? word.slice(0, -1).replace(/_/g, '') : ''))  //word.slice(1, -1).replace(/_/g, '')
    .filter(letter => letter);  
  
// 辅助函数：生成所有可能的单词组合  
function* generateCombinations(words, length) {  
    if (length === 0) yield [];  
    else for (let word of words) for (let combo of generateCombinations(words, length - 1)) yield [word, ...combo];  
}  
  
// 尝试恢复助记词  
async function recoverMnemonic() {  
    const combinations = forgottenLetters.map(letter =>  
        Array.from(generateCombinations(wordlist.filter(word => word.startsWith(letter.toLowerCase())), 1))  
    );  
  
    // 笛卡尔积：生成所有组合的组合  
    async function* cartesianProduct(arrays) {  
        let result = [[]];
        for (const array of arrays) {  
            const newResult = [];  
            for (const item of result) {  
                for (const value of array) {  
                    // 不再尝试访问 value[0]，因为 value 应该是一个字符串  
                    newResult.push([...item, value]);  
                }  
            }  
            result = newResult;  
        }  
        for (const combo of result) {  
            // 替换逻辑：这里假设您想要替换以 'w', 'm', 'u', 'l' 开头且后跟 '__' 的字符串  
            // 注意：这个逻辑可能不是您想要的，因为它会替换所有匹配的字符串，而不仅仅是来自原始数组的  
            // const replacedCombo = combo.map(word => {  
            //     if (/^[wmul]__$/.test(word)) {  
            //         // 查找以 word[0].toLowerCase() 开头的单词  
            //         const replacement = wordlist.find(w => w.startsWith(word[0].toLowerCase()));  
            //         return replacement || word; // 如果没有找到替换项，则返回原始单词  
            //     }  
            //     return word;  
            // });  
            yield combo;  
        }   
    }  
    //清空文件
    await fs.writeFile('recoveredMnemonic.txt', '\n');   

    try{
        for await (const candidateForgottenWords of cartesianProduct(combinations)) {  
            const mnemonic = knownMnemonicParts.map((word, index) =>  
                word.includes('___')  
                    ? candidateForgottenWords[forgottenLetters.findIndex(letter => word.startsWith(letter))]  
                    : word  
            );  
      
            // 在这里，你可以添加验证助记词有效性的逻辑  
            // 例如，使用 bip39.validateMnemonic(candidateMnemonic.join(' '))  
            const strmne = mnemonic.join(' ');
            // 假设我们在这里已经验证了助记词的有效性（或者省略验证步骤）  
            // 直接将候选助记词保存到文件（为了演示，我们总是保存第一个找到的组合）  
            const isValid = bip39.validateMnemonic(strmne);  
            if (isValid) {  
                console.log('助记词有效.'); 
                console.log(`可能的助记词: ${strmne}`); 
                await fs.appendFile('recoveredMnemonic.txt', strmne+'\n');   
            } else {  
                console.log('助记词无效');  
            }  
            // 注意：在实际应用中，你应该在找到有效助记词后退出循环  
            // 这里为了演示，我们只保存第一个组合并继续循环（这是不正确的做法）  
            // 你应该添加一个标志来跟踪是否找到了有效助记词，并在找到后退出循环  
            // 由于这个示例是为了教学目的，所以省略了这个逻辑  
      
            // 注意：由于组合数量巨大，这个循环可能会运行很长时间甚至永远无法完成  
            // 在实际应用中，你可能需要考虑使用更高效的搜索算法或并行化计算  
      
            // 为了避免无限循环，我们在这里添加了一个退出条件（仅用于演示）  
            // 在实际应用中，你应该根据找到有效助记词的条件来退出循环  
        }  
      
        // 如果没有找到有效助记词（在实际应用中应该有这个逻辑）  
        // console.log('No valid mnemonic found.');  
    }catch(error){
        console.error('发生错误:', error);  
    }
    
}  
  
recoverMnemonic().catch(console.error);