import { Elm } from 'MainModule';

console.log('Hello from main.ts!');
addEventListener('DOMContentLoaded', () => {
    console.log(document.getElementById('elm-node'));
    const app = Elm.Main.init({ node: document.getElementById('elm-node') });
});
