window.GameStageRegistry = window.GameStageRegistry || [];

window.GameStageRegistry.push({
    name: 'THE HOLY SPOON',
    secret: "There's not enough fun to be had",
    bgColor: '#2a0202',
    bgColorBottom: '#4f0808',
    backgroundThingType: 'particle',
    backgroundThingKind: 'star',
    backgroundThingCount: 260,
    particleColours: ['#3a0a0a', '#5c1010', '#7e1a1a', '#b32727'],
    enemyType: 'spoon',
    enemySpawnRate: 0.012,
    enemySpeedMin: 2,
    enemySpeedRange: 1,
    enemyPointsKill: 18,
    enemyPointsDamage: 3,
    enemyMaxHealth: 60,
    enemyTrackingChance: 0.7,
    enemyShowHealthBar: true,
    enemyFireRate: 0,
    enemyMissileDamage: 0,
    enemyCollisionDamage: 42,
    enemyMissileColor: '#ff2222',
    pointsToAdvance: 260
});
