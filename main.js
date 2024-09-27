import redisClt from './utils/redis';

(async () => {
    console.log(redisClt.isAlive());
    console.log(await redisClt.get('myKey'));
    await redisClt.set('myKey', 12, 5);
    console.log(await redisClt.get('myKey'));

    setTimeout(async () => {
        console.log(await redisClt.get('myKey'));
    }, 1000*10)
})();
