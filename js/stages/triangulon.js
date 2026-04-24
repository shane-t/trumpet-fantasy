window.GameStageRegistry = window.GameStageRegistry || [];

window.GameStageRegistry.push({
    name: 'TRIANGULON',
    secret: 'Everything self-perpetuates',
    bgColor: '#4ab4e8',
    bgColorBottom: '#d0eeff',
    backgroundThingType: 'image',
    backgroundThingKind: 'cloud',
    backgroundThingCount: 18,
    particleColours: ['#d9f3ff', '#e8f8ff', '#f2fbff', '#ffffff'],
    enemyType: 'triangle',
    enemySpawnRate: 0.006,
    enemySpeedMin: 1,
    enemySpeedRange: 2,
    enemyPointsKill: 14,
    enemyPointsDamage: 2,
    enemyMaxHealth: 300,
    enemyTrackingChance: 0.01,
    enemyShowHealthBar: true,
    enemyFireRate: 0.04,
    enemyMissileDamage: 10,
    enemyCollisionDamage: 40,
    enemyMissileColor: '#4a0033',
    pointsToAdvance: 220
});
