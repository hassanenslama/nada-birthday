const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'Christmas', 'Games', 'ChristmasGame.jsx');

let content = fs.readFileSync(filePath, 'utf8');

// Find and replace the broken useState with proper newlines
const brokenPattern = /const \[selectedCharacter, setSelectedCharacter\] = useState\(\(\) => \{ \\r\\n\s+const saved = localStorage\.getItem\('selectedCharacter'\); \\r\\nconsole\.log.*?\\r\\n \}\);/s;

const correctCode = `const [selectedCharacter, setSelectedCharacter] = useState(() => {
        const saved = localStorage.getItem('selectedCharacter');
        console.log('🔄 Loading saved character:', saved || 'mr-santa (default)');
        return saved || 'mr-santa';
    });`;

content = content.replace(brokenPattern, correctCode);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Fixed character loading code!');
