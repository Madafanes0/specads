#!/bin/sh
# Genera la librería de efectos y música (100 % sintetizada con ffmpeg, sin licencias).
# Uso: sh scripts/make-sounds.sh
set -e
S=public/audio/sfx
M=public/audio/music
mkdir -p $S $M
F="ffmpeg -loglevel error -y"
R="-ar 48000 -ac 2"

# Whooshes: ruido filtrado con envolvente
$F -f lavfi -i "anoisesrc=color=pink:duration=0.8:amplitude=0.9" -af "highpass=f=300,lowpass=f=3500,afade=t=in:st=0:d=0.35:curve=exp,afade=t=out:st=0.4:d=0.4:curve=exp,volume=1.6" $R $S/whoosh.wav
$F -f lavfi -i "anoisesrc=color=pink:duration=0.5:amplitude=0.7" -af "highpass=f=800,lowpass=f=6000,afade=t=in:st=0:d=0.2:curve=exp,afade=t=out:st=0.2:d=0.3:curve=exp" $R $S/swipe.wav
$F -f lavfi -i "anoisesrc=color=brown:duration=1.4:amplitude=1" -af "lowpass=f=1800,afade=t=in:st=0:d=0.7:curve=exp,afade=t=out:st=0.7:d=0.7:curve=exp,volume=2.4" $R $S/whoosh-big.wav

# Impacto grave (logo): sub que cae + golpe de ruido
$F -f lavfi -i "aevalsrc='0.9*sin(2*PI*(40*t+90/18*(1-exp(-18*t))))*exp(-3.2*t)':d=1.8" -f lavfi -i "anoisesrc=color=brown:duration=0.4:amplitude=1" \
  -filter_complex "[1]lowpass=f=700,afade=t=out:st=0:d=0.35:curve=exp[n];[0][n]amix=inputs=2:weights='1 0.6',volume=2.2,aecho=0.8:0.5:60:0.25" $R $S/impact.wav

# Riser: barrido ascendente + ruido que crece (1.5 s)
$F -f lavfi -i "aevalsrc='0.25*sin(2*PI*(180*t+260*t*t))*(t/1.5)':d=1.5" -f lavfi -i "anoisesrc=color=white:duration=1.5:amplitude=0.6" \
  -filter_complex "[1]highpass=f=2000,afade=t=in:st=0:d=1.5:curve=exp[n];[0][n]amix=inputs=2,volume=2" $R $S/riser.wav

# Hit del slogan: impacto suave + brillo
$F -f lavfi -i "aevalsrc='0.7*sin(2*PI*(55*t+60/14*(1-exp(-14*t))))*exp(-4*t)+0.12*sin(2*PI*1760*t)*exp(-6*t)+0.08*sin(2*PI*2637*t)*exp(-5*t)':d=1.6" -af "aecho=0.8:0.6:90|180:0.3|0.15,volume=1.6" $R $S/hit.wav

# UI: pop, tap, tecla, tick
$F -f lavfi -i "aevalsrc='0.8*sin(2*PI*(500*t+5200*t*t))*exp(-38*t)':d=0.18" $R $S/pop.wav
$F -f lavfi -i "aevalsrc='0.6*sin(2*PI*2400*t)*exp(-90*t)+0.4*sin(2*PI*900*t)*exp(-60*t)':d=0.08" -af "volume=1.4" $R $S/tap.wav
$F -f lavfi -i "anoisesrc=color=white:duration=0.03:amplitude=0.8" -af "bandpass=f=3500:w=2500,afade=t=out:st=0:d=0.03" $R $S/type.wav
$F -f lavfi -i "aevalsrc='0.5*sin(2*PI*1800*t)*exp(-120*t)':d=0.05" $R $S/tick.wav

# Éxito: dos notas (ding-ding) y monedas (arpegio brillante)
$F -f lavfi -i "aevalsrc='0.5*sin(2*PI*1318.5*t)*exp(-7*t)+0.5*sin(2*PI*1975.5*(t-0.11))*exp(-6*(t-0.11))*gte(t,0.11)':d=0.9" -af "aecho=0.8:0.5:70:0.2,volume=1.2" $R $S/success.wav
$F -f lavfi -i "aevalsrc='0.4*sin(2*PI*1046.5*t)*exp(-14*t)+0.4*sin(2*PI*1318.5*(t-0.07))*exp(-14*(t-0.07))*gte(t,0.07)+0.4*sin(2*PI*1568*(t-0.14))*exp(-10*(t-0.14))*gte(t,0.14)+0.3*sin(2*PI*2093*(t-0.21))*exp(-8*(t-0.21))*gte(t,0.21)':d=0.8" -af "aecho=0.8:0.4:50:0.2" $R $S/coin.wav

# Mapa: golpe de aterrizaje y ping de sonar
$F -f lavfi -i "aevalsrc='0.9*sin(2*PI*(70*t+80/30*(1-exp(-30*t))))*exp(-12*t)':d=0.4" -af "volume=1.8" $R $S/thud.wav
$F -f lavfi -i "aevalsrc='0.45*sin(2*PI*1046*t)*exp(-4*t)':d=1.4" -af "aecho=0.8:0.7:180|360:0.4|0.2" $R $S/ping.wav

# Aleteo: tres golpes de ruido grave
$F -f lavfi -i "anoisesrc=color=brown:duration=0.5:amplitude=1" -af "lowpass=f=900,volume='0.2+0.8*abs(sin(2*PI*9*t))':eval=frame,afade=t=out:st=0.25:d=0.25,volume=1.5" $R $S/flap.wav

# Barra que crece: tono ascendente
$F -f lavfi -i "aevalsrc='0.3*sin(2*PI*(220*t+300*t*t))*(1-exp(-20*t))*exp(-1.2*t)':d=1.0" $R $S/rise.wav

# ---------------------------------------------------------------- música
# Genera una pista a partir de: BPM, acordes (4 por ciclo), bajo y carácter.
music () {
  NAME=$1; BPM=$2; CH=$3; BASS=$4; DUR=30
  B=$(echo "60/$BPM" | bc -l)
  # Kick 4x4
  $F -f lavfi -i "aevalsrc='0.95*sin(2*PI*(45*mod(t,$B)+110/25*(1-exp(-25*mod(t,$B)))))*exp(-7*mod(t,$B))':d=$DUR" $R /tmp/_k.wav
  # Clap en 2 y 4
  $F -f lavfi -i "aevalsrc='(random(0)*2-1)*exp(-28*mod(t-$B,2*$B))*gte(t,$B)':d=$DUR" -af "bandpass=f=1600:w=1200,volume=1.3" $R /tmp/_c.wav
  # Hats en corcheas (acento en el contratiempo)
  $F -f lavfi -i "aevalsrc='(random(0)*2-1)*exp(-70*mod(t,$B/2))*(0.25+0.35*gte(mod(t,$B),$B/2))':d=$DUR" -af "highpass=f=7000,volume=0.9" $R /tmp/_h.wav
  # Bajo con "sidechain" (bombea con el kick)
  $F -f lavfi -i "aevalsrc='0.55*sin(2*PI*($BASS)*t)*(1-exp(-9*mod(t,$B)))':d=$DUR" -af "lowpass=f=400" $R /tmp/_b.wav
  # Pad de acordes con ataque lento
  $F -f lavfi -i "aevalsrc='($CH)*(0.35+0.15*sin(2*PI*0.25*t))*(1-exp(-6*mod(t,8*$B)))*(1-exp(-7*mod(t,$B))*0.5)':d=$DUR" -af "lowpass=f=2400,aecho=0.8:0.6:220|330:0.3|0.2" $R /tmp/_p.wav
  $F -i /tmp/_k.wav -i /tmp/_c.wav -i /tmp/_h.wav -i /tmp/_b.wav -i /tmp/_p.wav \
    -filter_complex "amix=inputs=5:weights='1 0.5 0.35 0.8 0.55':normalize=0,alimiter=limit=0.9,afade=t=in:st=0:d=0.2" $R $M/$NAME.wav
  rm -f /tmp/_k.wav /tmp/_c.wav /tmp/_h.wav /tmp/_b.wav /tmp/_p.wav
}

# Selector de acorde por compás (4 compases de 4 tiempos)
sel () { # $1 $2 $3 $4 = valores por compás, $5 = duración de compás
  echo "if(lt(mod(t,4*$5),$5),$1,if(lt(mod(t,4*$5),2*$5),$2,if(lt(mod(t,4*$5),3*$5),$3,$4)))"
}
chord () { # tres frecuencias por compás → suma de senos
  BAR=$1; shift
  echo "0.12*sin(2*PI*$(sel $1 $2 $3 $4 $BAR)*t)+0.1*sin(2*PI*$(sel $5 $6 $7 $8 $BAR)*t)+0.08*sin(2*PI*$(sel $9 ${10} ${11} ${12} $BAR)*t)"
}

# "drive" 118 BPM, menor (Am F C G): oscura y elegante
BAR=$(echo "4*60/118" | bc -l)
music drive-118 118 "$(chord $BAR 220 174.6 261.6 196 261.6 220 329.6 246.9 329.6 261.6 392 293.7)" "$(sel 55 43.65 65.41 49 $BAR)"
# "bounce" 128 BPM, mayor (C G Am F): alegre y luminosa
BAR=$(echo "4*60/128" | bc -l)
music bounce-128 128 "$(chord $BAR 261.6 246.9 220 174.6 329.6 293.7 261.6 220 392 392 329.6 261.6)" "$(sel 65.41 49 55 43.65 $BAR)"

echo "✓ sonidos en $S y $M"
