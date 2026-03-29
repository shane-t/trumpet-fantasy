window.GameStageRegistry = window.GameStageRegistry || [];

window.GameStageRegistry.push({
    name: 'GENERAL MIAOW',
    secret: 'Impossible things keep happening',
    bgColor: '#00007a',
    bgColorBottom: '#00001e',
    backgroundThingType: 'particle',
    backgroundThingKind: 'star',
    backgroundThingCount: 250,
    particleColours: ['#777777', '#999999', '#cccccc', '#ffffff'],
    enemyType: 'miaow',
    enemySpawnRate: 0.042,
    enemySpeedMin: 2,
    enemySpeedRange: 2,
    enemyPointsKill: 5,
    enemyPointsDamage: 1,
    enemyMaxHealth: 80,
    enemyTrackingChance: 0.06,
    enemyShowHealthBar: false,
    enemyFireRate: 0.01,
    enemyMissileDamage: 8,
    enemyCollisionDamage: 14,
    enemyMissileColor: '#ff33cc',
    pointsToAdvance: 140
});
