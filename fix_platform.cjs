const fs = require('fs');

const filePath = 'C:/Users/Hassanen/Desktop/Nada Birthday/src/components/Christmas/Games/ChristmasGame.jsx';
const content = fs.readFileSync(filePath, 'utf8');

// Find the line with player.update and insert platform detection before it
const searchLine = '            player.update(deltaTime, compositeInput, 500);';

const platformCode = `            // === CALCULATE EFFECTIVE GROUND Y ===
            // Find nearest platform below player to determine correct ground level
            let effectiveGroundY = 500; // Default base ground level
            
            if (player.y + player.height < killY) {
                // Only check platforms if player is above death plane
                worldEntities.platforms.forEach(platform => {
                    // Check if player is horizontally aligned with platform
                    if (player.x + player.width > platform.x && player.x < platform.x + platform.width) {
                        const platformTop = platform.y;
                        const feetPos = player.y + player.height;
                        
                        // Check if platform is below player and within landing range
                        // Use platform as ground if player is falling towards it or standing on it
                        if (player.vy >= 0 && feetPos >= platformTop - 5 && feetPos <= platformTop + 25) {
                            effectiveGroundY = platformTop;
                        }
                    }
                });
            }

            player.update(deltaTime, compositeInput, effectiveGroundY);`;

const newContent = content.replace(searchLine, platformCode);

if (content === newContent) {
    console.log('ERROR: No replacement made!');
    process.exit(1);
}

fs.writeFileSync(filePath, newContent, 'utf8');
console.log('SUCCESS: Platform ground calculation added!');
