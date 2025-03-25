from flask import Flask, request, jsonify
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
import time
from bs4 import BeautifulSoup

app = Flask(__name__)

@app.route('/scrape', methods=['GET'])
def scrape():
    doc = request.args.get('doc')
    if not doc:
        return jsonify({'error': 'No se ha proporcionado el parámetro "doc".'}), 400

    try:
        options = uc.ChromeOptions()
        options.add_argument('--headless')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-blink-features=AutomationControlled')

        driver = uc.Chrome(options=options)
        driver.set_window_size(851, 713)
        driver.get("https://eldni.com/pe/buscar-por-dni")
        time.sleep(2)

        dni_input = driver.find_element(By.ID, "dni")
        dni_input.click()
        dni_input.clear()
        dni_input.send_keys(doc)

        btn_buscar = driver.find_element(By.ID, "btn-buscar-por-dni")
        btn_buscar.click()
        time.sleep(2)

        completos_btn = driver.find_element(By.ID, "completos")
        completos_btn.click()
        time.sleep(2)

        html = driver.page_source
        driver.quit()

        # Parseamos el HTML para extraer la tabla de resultados
        soup = BeautifulSoup(html, 'html.parser')
        table = soup.find('table', {'class': 'table'})
        if table:
            tbody = table.find('tbody')
            if tbody:
                row = tbody.find('tr')
                if row:
                    cells = row.find_all('td')
                    if len(cells) >= 4:
                        data = {
                            'DNI': cells[0].get_text(strip=True),
                            'Nombres': cells[1].get_text(strip=True),
                            'Apellido Paterno': cells[2].get_text(strip=True),
                            'Apellido Materno': cells[3].get_text(strip=True)
                        }
                        # Formatear el resultado en el orden deseado
                        result_str = f"{data['DNI']} {data['Nombres']} {data['Apellido Paterno']} {data['Apellido Materno']}"
                        return jsonify({'result': result_str})
        
        # Si no se encontró la tabla o datos, se retorna el HTML completo
        return jsonify({'result': html})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8080)
