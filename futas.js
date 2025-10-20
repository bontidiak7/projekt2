(function(){
    const id = azonosito => document.getElementById(azonosito);
    const szamFormaz = (szam, tizedes=2) => Number(szam||0).toFixed(tizedes).replace(/\.00$/,'');

    function futasokLeker(){ return JSON.parse(localStorage.getItem('futasok')||'[]'); }
    function futasokMent(futasok){ localStorage.setItem('futasok', JSON.stringify(futasok)); }
    function celLeker(){ return Number(localStorage.getItem('hetiCel')||20); }
    function celMent(ertek){ localStorage.setItem('hetiCel', String(ertek)); }

    function szamitas(tavKm, idoPerc, testsulyKg, met){
        const ora = (Number(idoPerc)||0)/60;
        const sebesseg = ora>0 ? (Number(tavKm)||0)/ora : 0;
        const kaloria = Number(met||0) * Number(testsulyKg||0) * ora;
        return { ora, sebesseg, kaloria };
    }

    function futasokMegjelenit(){
        const kontener = id('futasok-lista');
        const futasok = futasokLeker().sort((a,b)=> new Date(b.datum) - new Date(a.datum));
        if(futasok.length===0){ kontener.textContent = 'Nincsenek rögzített futások.'; return; }
        kontener.innerHTML = '';
        futasok.forEach(futas=>{
            const sor = document.createElement('div');
            sor.className = 'run-item';
            sor.innerHTML = `\
                <div>\
                    <strong>${futas.datum}</strong> — ${futas.megjegyzes||''}\
                </div>\
                <div>\
                    ${szamFormaz(futas.tav,2)} km, ${szamFormaz(futas.ido,1)} min, ${szamFormaz(futas.sebesseg,2)} km/h, ${szamFormaz(futas.kaloria,0)} kcal\
                </div>\
                <div class='run-actions'>\
                    <button class='edit-btn' data-id='${futas.id}'>Szerkeszt</button>\
                    <button class='del-btn' data-id='${futas.id}'>Töröl</button>\
                </div>`;
            kontener.appendChild(sor);
        });
        kontener.querySelectorAll('.edit-btn').forEach(gomb=>gomb.addEventListener('click', e=> futasSzerkeszt(e.target.dataset.id)));
        kontener.querySelectorAll('.del-btn').forEach(gomb=>gomb.addEventListener('click', e=> futasTorol(e.target.dataset.id)));
    }

    function osszegzesMegjelenit(){
        const futasok = futasokLeker();
        const osszTav = futasok.reduce((s,f)=> s + (Number(f.tav)||0),0);
        const osszOra = futasok.reduce((s,f)=> s + ((Number(f.ido)||0)/60),0);
        const atlagSeb = osszOra>0 ? osszTav/osszOra : 0;
        const osszKaloria = futasok.reduce((s,f)=> s + (Number(f.kaloria)||0),0);
        id('ossz-tav').textContent = szamFormaz(osszTav,2);
        id('atlag-seb').textContent = szamFormaz(atlagSeb,2);
        id('ossz-kaloria').textContent = szamFormaz(osszKaloria,0);

        const hetiCel = celLeker();
        id('heti-cel-ertek').textContent = szamFormaz(hetiCel,1);
        const hetKezdet = hetElsoNapja(new Date());
        const hetVege = new Date(hetKezdet); hetVege.setDate(hetVege.getDate()+7);
        const hetiOsszeg = futasok.reduce((s,f)=>{
            const d = new Date(f.datum+'T00:00');
            return (d>=hetKezdet && d<hetVege) ? s + (Number(f.tav)||0) : s;
        },0);
        id('heti-teljesites').textContent = szamFormaz(hetiOsszeg,2);
    }

    function hetElsoNapja(datum){
        const x = new Date(datum.getFullYear(), datum.getMonth(), datum.getDate());
        const nap = x.getDay();
        const kulonbseg = (nap===0 ? -6 : 1) - nap;
        x.setDate(x.getDate() + kulonbseg); x.setHours(0,0,0,0);
        return x;
    }

    function urlapTorol(){
        id('futas-azonosito').value=''; id('datum').value=''; id('tav').value=''; id('ido').value=''; id('testsuly').value='70'; id('met').value='9.8'; id('megjegyzes').value=''; id('mentes-gomb').textContent='Mentés';
    }

    function futasSzerkeszt(azon){
        const futasok = futasokLeker(); const futas = futasok.find(x=> String(x.id)===String(azon)); if(!futas) return;
        id('futas-azonosito').value = futas.id; id('datum').value = futas.datum; id('tav').value = futas.tav; id('ido').value = futas.ido; id('testsuly').value = futas.testsuly || 70; id('met').value = futas.met || 9.8; id('megjegyzes').value = futas.megjegyzes || ''; id('mentes-gomb').textContent='Frissít'; window.scrollTo({top:0});
    }

    function futasTorol(azon){ if(!confirm('Biztos törlöd?')) return; let futasok = futasokLeker(); futasok = futasok.filter(f=> String(f.id)!==String(azon)); futasokMent(futasok); futasokMegjelenit(); osszegzesMegjelenit(); }

    function init(){
        id('futas-urlap').addEventListener('submit', e=>{
            e.preventDefault();
            const azon = id('futas-azonosito').value; const datum = id('datum').value; const tav = id('tav').value; const ido = id('ido').value; const testsuly = id('testsuly').value || 70; const met = id('met').value; const megjegyzes = id('megjegyzes').value;
            if(!datum || !tav || !ido) return alert('Töltsd ki a kötelező mezőket.');
            const szam = szamitas(tav, ido, testsuly, met);
            const futasok = futasokLeker();
            if(azon){
                const idx = futasok.findIndex(f=> String(f.id)===String(azon));
                if(idx>=0) futasok[idx] = { id: futasok[idx].id, datum, tav: Number(tav), ido: Number(ido), testsuly: Number(testsuly), met: Number(met), megjegyzes, sebesseg: szam.sebesseg, kaloria: szam.kaloria };
            } else {
                futasok.push({ id: Date.now(), datum, tav: Number(tav), ido: Number(ido), testsuly: Number(testsuly), met: Number(met), megjegyzes, sebesseg: szam.sebesseg, kaloria: szam.kaloria });
            }
            futasokMent(futasok); urlapTorol(); futasokMegjelenit(); osszegzesMegjelenit();
        });

        id('torles-gomb').addEventListener('click', e=>{ e.preventDefault(); urlapTorol(); });
        id('cel-mentes').addEventListener('click', ()=>{ const v = Number(id('heti-cel').value)||0; celMent(v); osszegzesMegjelenit(); alert('Cél elmentve.'); });

        ['tav','ido','testsuly','met'].forEach(mezon=> id(mezon).addEventListener('input', ()=>{ const t = id('tav').value; const i = id('ido').value; const ts = id('testsuly').value; const m = id('met').value; const sz = szamitas(t,i,ts,m); id('atlag-seb').textContent = szamFormaz(sz.sebesseg,2); }));

        id('heti-cel').value = celLeker(); futasokMegjelenit(); osszegzesMegjelenit();
    }

    document.addEventListener('DOMContentLoaded', init);
})();