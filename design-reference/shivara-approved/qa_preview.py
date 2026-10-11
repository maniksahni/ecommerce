from playwright.sync_api import sync_playwright
import base64
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
import threading,os
path=Path(__file__).parent
os.chdir(path)
server=ThreadingHTTPServer(('127.0.0.1',0),SimpleHTTPRequestHandler)
threading.Thread(target=server.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{server.server_port}/index.html'
html=(path/'index.html').read_text()
html=html.replace('<link rel="stylesheet" href="styles.css">', '<style>'+ (path/'styles.css').read_text() + '</style>')
html=html.replace('<script src="preview.js"></script>', '<script>'+(path/'preview.js').read_text()+'</script>')
for imgpath in (path/'assets').glob('*.webp'):
 name='assets/'+imgpath.name
 uri='data:image/webp;base64,'+base64.b64encode(imgpath.read_bytes()).decode()
 html=html.replace(name,uri)
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for w,h in [(1440,980),(1024,850),(768,900),(430,932),(390,844),(360,800),(320,700)]:
  page=browser.new_page(viewport={'width':w,'height':h},device_scale_factor=1)
  page.set_content(html,wait_until="domcontentloaded")
  page.screenshot(path=str(path/f'screenshot-{w}.png'),full_page=True)
  metrics=page.evaluate("""() => ({screen: innerWidth, scroll: document.documentElement.scrollWidth, hero: document.querySelector('.hero').getBoundingClientRect().toJSON(), logo: document.querySelector('.wordmark').getBoundingClientRect().toJSON(), cart: document.querySelector('#bag-toggle').getBoundingClientRect().toJSON(), visible: getComputedStyle(document.querySelector('.bottom-nav')).display})""")
  print(w,metrics['screen'],metrics['scroll'],'overflow=',metrics['scroll']>metrics['screen'],'cart right',metrics['cart']['right'],'logo right',metrics['logo']['right'],'bottom',metrics['visible'])
  assert metrics['scroll']<=w+1, f'horizontal overflow {w}'
  assert metrics['cart']['right']<=w and metrics['cart']['left']>=0, 'cart offscreen'
  if w<=700:
   assert metrics['logo']['right']+4<metrics['cart']['left'], 'cart and logo overlap'
   assert metrics['visible']=='grid'
  page.close()
 browser.close()
server.shutdown()
