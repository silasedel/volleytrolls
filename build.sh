#!/bin/bash
# Builds volley-trolls.html: page shell + embedded sounds + face photo + all game source files in order.
cd "$(dirname "$0")"
{
  cat src/00-head.html
  echo '<script type="module">'
  python3 -c "import base64,os,glob; print('const SND_SRC={'+','.join(repr(os.path.basename(f)[:-4])+':'+repr(base64.b64encode(open(f,'rb').read()).decode()) for f in sorted(glob.glob('src/sounds/*.mp3')))+'};')"
  printf 'const FACE_URI="data:image/jpeg;base64,'; tr -d '\n' < src/face.b64; printf '";\n'
  for f in src/[0-9][0-9]-*.js; do cat "$f"; echo; done
  echo '</script>'
} > volley-trolls.html
