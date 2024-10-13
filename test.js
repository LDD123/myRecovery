import bip39 from 'bip39';  
const knownMnemonicParts = [  
    'gate', 'swap', 'soup', 'father', // 已知的助记词  
    'wide',  // 遗忘的单词，首字母为'c'  
    'uncle',  // 遗忘的单词，首字母为'm'  
    'curtain',  //crystal 遗忘的单词，首字母为't'  
    'size',  // solid遗忘的单词，首字母为's'  
    // 剩余的已知助记词（假设你知道它们的位置）  
    'artefact', 'unable', 'fox', 'slot'  
  ];  
  const mnemonicString = knownMnemonicParts.join(' ');  

  try {  
    const isValid = bip39.validateMnemonic(mnemonicString);  
    if (isValid) {  
        console.log('助记词有效.'); 
        console.log(`可能的助记词: ${knownMnemonicParts}`);  
 
    } else {  
        console.log('助记词无效');  
    }  

    // 你可以在这里添加额外的逻辑，比如保存有效的助记词或进一步处理  
  } catch (error) {  
    // 如果助记词无效，则忽略这个组合  
    console.log(`错误: ${error}`);  

  }  
