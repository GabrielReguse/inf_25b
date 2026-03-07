// seletor de abas com seta flutuante
const btns = document.querySelectorAll('.seletor-btn');
const paineis = document.querySelectorAll('.painel');
const seta = document.querySelector('.seta-flutuante');
const grade = document.querySelector('.seletores');

function posicionarSeta(index) {
    const larguraGrade = grade.offsetWidth;
    const gap = 12;
    const colWidth = (larguraGrade - gap * 2) / 3;
    const centroColuna = index * (colWidth + gap) + colWidth / 2;
    seta.style.transform = `translateX(${centroColuna}px) translateX(-50%)`;
}
function trocarAba(index) {
    btns.forEach((b, i) => b.classList.toggle('ativo', i === index));
    paineis.forEach((p, i) => p.classList.toggle('ativo', i === index));
    posicionarSeta(index);
}

btns.forEach((btn, i) => btn.addEventListener('click', () => trocarAba(i)));

// posição inicial
window.addEventListener('load', () => posicionarSeta(0));
window.addEventListener('resize', () => {
    const ativo = [...btns].findIndex(b => b.classList.contains('ativo'));
    posicionarSeta(ativo);
});