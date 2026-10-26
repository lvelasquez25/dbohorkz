"""
Script para cargar productos en el backend vía API.
Uso: SEED_USERNAME=admin SEED_PASSWORD=tupass python seed_remote.py
"""
import requests

import os

API_URL = os.getenv('API_URL', 'https://api.dbohorkz.com')

# Credenciales del admin (pasar como variables de entorno)
USERNAME = os.getenv('SEED_USERNAME', 'admin')
PASSWORD = os.getenv('SEED_PASSWORD', '')

productos = [
    ('Acrilico N3', 'Acrílico institucional N3 para uniforme INPEC.', 25000, 50, 'ACRILICO N3.jpg', 'Uniforme #3'),
    ('Araña con Accesorios', 'Araña táctica con accesorios completos.', 35000, 30, 'ARAÑA CON ACCESORIOS.jpg', 'Correaje y Cinturones'),
    ('Araña Piernera', 'Araña piernera para dotación táctica.', 28000, 40, 'ARAÑA PIERNERA.jpg', 'Correaje y Cinturones'),
    ('Bandera N3', 'Bandera institucional N3 bordada.', 22000, 60, 'BANDERA N3.jpg', 'Insignias y Bordados'),
    ('Bandera Cuadrada', 'Bandera cuadrada institucional bordada.', 20000, 60, 'BANDERA CUADRADA.jpg', 'Insignias y Bordados'),
    ('Bolso Horizontal Celular', 'Bolso horizontal porta celular táctico.', 30000, 35, 'BOLSO HORIZONTAL CEL.jpg', 'Bolsos'),
    ('Botones N3', 'Set de botones institucionales N3.', 8000, 100, 'BOTONES N3.jpg', 'Uniforme #3'),
    ('Camisa N3', 'Camisa institucional N3 manga larga.', 65000, 30, 'CAMISA N3.jpg', 'Uniforme #3'),
    ('Cartucho de Vida', 'Cartucho de vida para dotación oficial.', 18000, 50, 'CARTUCHO DE VIDA.jpg', 'Defensa y Seguridad'),
    ('Chaco N3', 'Chaco institucional N3 INPEC.', 45000, 25, 'CHACO N3.jpg', 'Uniforme #3'),
    ('Chapuza Interior Pistola', 'Chapuza interior para pistola reglamentaria.', 40000, 20, 'CHAPUZA INT PISTOLA.jpg', 'Chapuzas'),
    ('Cobija Tipo Liviano', 'Cobija tipo liviano para dotación.', 55000, 20, 'COBIJA TIPO LIVIANO.jpg', 'Equipos y Accesorios'),
    ('Colcha Escudo EPN', 'Colcha con escudo EPN bordado.', 70000, 15, 'COLCHA ESCUDO EPN.jpg', 'Equipos y Accesorios'),
    ('Cordones de Bota', 'Cordones de bota resistentes para dotación.', 5000, 200, 'CORDONES DE BOTA.jpg', 'Uniformes y Vestimenta'),
    ('Correa N3', 'Correa institucional N3 INPEC.', 35000, 40, 'CORREA N3.jpg', 'Correaje y Cinturones'),
    ('Correa Caiman', 'Correa caimán de alta resistencia.', 38000, 35, 'CORREA CAIMAN.jpg', 'Correaje y Cinturones'),
    ('Correa Tactica Fusil', 'Correa táctica para fusil reglamentario.', 42000, 25, 'CORREA TACTICA FUSIL.jpg', 'Correaje y Cinturones'),
    ('Correa Tactica', 'Correa táctica multiusos para dotación.', 40000, 40, 'CORREA TACTICA.jpg', 'Correaje y Cinturones'),
    ('Escudo INPEC N3', 'Escudo INPEC bordado N3 oficial.', 15000, 80, 'ESCUDO INPEC N3.jpg', 'Insignias y Bordados'),
    ('Escudo INPEC Fatiga', 'Escudo INPEC para traje de fatiga.', 15000, 80, 'ESCUDO INPEC FATIGA.jpg', 'Insignias y Bordados'),
    ('Escudo Kepis', 'Escudo bordado para kepis oficial.', 12000, 100, 'ESCUDO KEPIS.jpg', 'Insignias y Bordados'),
    ('Escudo PJ', 'Escudo PJ bordado institucional.', 12000, 100, 'ESCUDO PJ.jpg', 'Insignias y Bordados'),
    ('Estuche Gas Lona', 'Estuche en lona para gas defensivo.', 28000, 30, 'ESTUCHE GAS LONA.jpg', 'Defensa y Seguridad'),
    ('Estuche Linterna', 'Estuche porta linterna oficial.', 22000, 45, 'ESTUCHE LINTERNA ABIERTO.jpg', 'Linternas'),
    ('Escudo GOCAN', 'Escudo GOCAN bordado institucional.', 12000, 80, 'ESUDO GOCAN.jpg', 'Insignias y Bordados'),
    ('Extensor Pistola', 'Extensor para pistola reglamentaria.', 35000, 25, 'EXTENSOR PISTOLA.jpg', 'Defensa y Seguridad'),
    ('Gas Sabre', 'Gas sable defensivo para dotación.', 45000, 20, 'GAS SABRE.jpg', 'Defensa y Seguridad'),
    ('Gorra Advantage', 'Gorra Advantage oficial para personal INPEC.', 35000, 50, 'GORRA ADVANTAGE.jpg', 'Gorras'),
    ('Jineta N3', 'Jineta institucional N3 bordada.', 18000, 70, 'JINETA N3.jpg', 'Insignias y Bordados'),
    ('Jineta Rombo', 'Jineta rombo institucional bordada.', 18000, 70, 'JINETA ROMBO.jpg', 'Insignias y Bordados'),
    ('Kepis N3', 'Kepis institucional N3 oficial INPEC.', 55000, 25, 'KEPIS N3.jpg', 'Uniforme #3'),
    ('Libreta Bolsillo', 'Libreta de bolsillo para personal de guardia.', 8000, 150, 'LIBRETA BOLSILLO.jpg', 'Equipos y Accesorios'),
    ('Libros Cuello N3', 'Libros de cuello N3 institucionales.', 10000, 100, 'LIBROS CUELLO N3.jpg', 'Uniforme #3'),
    ('Liga Corrugada', 'Liga corrugada para dotación táctica.', 6000, 120, 'LIGA CORRUGADA.jpg', 'Presillas'),
    ('Liga INPEC', 'Liga oficial INPEC para uniforme.', 6000, 120, 'LIGA INPEC.jpg', 'Presillas'),
    ('Linterna USB', 'Linterna recargable USB para servicio nocturno.', 38000, 30, 'LINTERNA USB.jpg', 'Linternas'),
    ('Linterna UV', 'Linterna ultravioleta para inspección.', 42000, 20, 'LINTERNA UV.jpg', 'Linternas'),
    ('Llave de Restriccion', 'Llave universal para restricciones.', 25000, 40, 'LLAVE DE RESTRICCION.jpg', 'Defensa y Seguridad'),
    ('Llave Restriccion Smith Wesson', 'Llave para restricciones Smith & Wesson.', 30000, 30, 'LLAVE RESTRICCION SMIT WESSON.jpg', 'Defensa y Seguridad'),
    ('Medias Fatiga', 'Medias de fatiga para dotación INPEC.', 12000, 100, 'MEDIAS FATIGA.jpg', 'Uniformes y Vestimenta'),
    ('Navaja Daga', 'Navaja daga táctica para dotación.', 55000, 15, 'NAVAJA DAGA.jpg', 'Defensa y Seguridad'),
    ('Pantaloneta', 'Pantaloneta institucional para dotación.', 35000, 40, 'PANTALONETA.jpg', 'Uniformes y Vestimenta'),
    ('Pasamontana Moto', 'Pasamontaña para uso en moto y operativos.', 22000, 50, 'PASAMONTAÑA MOTO.jpg', 'Uniformes y Vestimenta'),
    ('Panoleta', 'Pañoleta institucional para uniforme.', 15000, 60, 'PAÑOLETA.jpg', 'Uniformes y Vestimenta'),
    ('Piernera Aleta', 'Piernera aleta táctica para dotación.', 32000, 35, 'PIERNERA ALETA.jpg', 'Correaje y Cinturones'),
    ('Piernera Sencilla', 'Piernera sencilla para dotación oficial.', 28000, 40, 'PIERNERA SENCILLA.jpg', 'Correaje y Cinturones'),
    ('Piocha N3', 'Piocha institucional N3 oficial.', 10000, 100, 'PIOCHA N3.jpg', 'Insignias y Bordados'),
    ('Pito', 'Pito reglamentario para personal de guardia.', 8000, 150, 'PITO.jpg', 'Equipos y Accesorios'),
    ('Placa', 'Placa institucional oficial INPEC.', 20000, 60, 'PLACA.jpg', 'Insignias y Bordados'),
    ('Porta Carnet con Cinta', 'Porta carnet con cinta retráctil.', 12000, 80, 'PORTA CARNET CINTA.jpg', 'Portatiles y Fundas'),
    ('Porta Cubiertos', 'Porta cubiertos para dotación de campo.', 18000, 40, 'PORTA CUBIERTOS.jpg', 'Portatiles y Fundas'),
    ('Porta Gas Tactico', 'Porta gas táctico para cinturón.', 28000, 35, 'PORTA GAS TACTICO.jpg', 'Portatiles y Fundas'),
    ('Porta Guantes Nitrilo', 'Porta guantes de nitrilo para uniforme.', 20000, 50, 'PORTA GUANTES NITRILO.jpg', 'Portatiles y Fundas'),
    ('Porta Linterna Oficial', 'Porta linterna oficial para cinturón.', 22000, 40, 'PORTA LINTERNA OFICIAL.jpg', 'Linternas'),
    ('Porta Radio', 'Porta radio táctico para dotación.', 30000, 30, 'PORTA RADIO.jpg', 'Portatiles y Fundas'),
    ('Porta Restriccion Cerrado', 'Porta restricción cerrado para cinturón.', 28000, 35, 'PORTA RESTRICCION CERRADO.jpg', 'Portatiles y Fundas'),
    ('Porta Restriccion Tactico', 'Porta restricción táctico multiposición.', 32000, 30, 'PORTA RESTRICCION TACTICO.jpg', 'Portatiles y Fundas'),
    ('Porta Tambo Tactico', 'Porta tambo táctico para cinturón.', 28000, 35, 'PORTA TAMBO TACTICO.jpg', 'Portatiles y Fundas'),
    ('Porta Tonfa Anillo', 'Porta tonfa con anillo para cinturón.', 25000, 40, 'PORTA TONFA ANILLO.jpg', 'Portatiles y Fundas'),
    ('Porta Tonfa Lona', 'Porta tonfa en lona resistente.', 22000, 40, 'PORTA TONFA LONA.jpg', 'Portatiles y Fundas'),
    ('Porta Tonfa Tactico', 'Porta tonfa táctico multiposición.', 30000, 35, 'PORTA TONFA TACTICO.jpg', 'Portatiles y Fundas'),
    ('Puente Escudo Bordado', 'Puente con escudo bordado institucional.', 18000, 60, 'PUENTE ESCUDO BORDADO.jpg', 'Insignias y Bordados'),
    ('Reata Oficial', 'Reata oficial para uniforme INPEC.', 15000, 80, 'REATA OFICIAL.jpg', 'Correaje y Cinturones'),
    ('Reata Rigida AAA', 'Reata rígida AAA de alta resistencia.', 18000, 60, 'REATA RIGIDA AAA.jpg', 'Correaje y Cinturones'),
    ('Restriccion de Dedo', 'Restricción de dedo para control de detenidos.', 22000, 50, 'RESTRICCION DE DEDO.jpg', 'Defensa y Seguridad'),
    ('Restriccion Economica', 'Restricción económica desechable.', 8000, 200, 'RESTRICCION ECONOMICA.jpg', 'Defensa y Seguridad'),
    ('RH Cosido', 'RH cosido para dotación oficial.', 12000, 80, 'RH COSIDO.jpg', 'Presillas'),
    ('RH Presilla', 'RH presilla para uniforme institucional.', 12000, 80, 'RH PRESILLA.jpg', 'Presillas'),
    ('Silla Portatil', 'Silla portátil para guardias de larga jornada.', 85000, 10, 'SILLA PORTATIL.jpg', 'Equipos y Accesorios'),
    ('Tambo Corto', 'Tambo corto de defensa personal.', 65000, 20, 'TAMBO CORTO.jpg', 'Defensa y Seguridad'),
    ('Tambo Largo', 'Tambo largo de defensa personal.', 75000, 15, 'TAMBO LARGO.jpg', 'Defensa y Seguridad'),
    ('Tarjetero Apellido con Piochas', 'Tarjetero de apellido con piochas.', 15000, 70, 'TARJETERO APELLIDO CON PIOCHAS.jpg', 'Insignias y Bordados'),
    ('Tarjetero INPEC con Piocha', 'Tarjetero INPEC con piocha incorporada.', 15000, 70, 'TARJETERO INPEC CON PIOCHA.jpg', 'Insignias y Bordados'),
    ('Tarjetero INPEC', 'Tarjetero institucional INPEC oficial.', 12000, 80, 'TARJETERO INPEC.jpg', 'Insignias y Bordados'),
    ('Toalla Escudo EPN', 'Toalla con escudo EPN bordado.', 35000, 25, 'TOALLA ESCUDO EPN.jpg', 'Equipos y Accesorios'),
    ('Toalla Escudo INPEC', 'Toalla con escudo INPEC bordado.', 35000, 25, 'TOALLA ESCUDO INPEC.jpg', 'Equipos y Accesorios'),
    ('Tonfa', 'Tonfa de defensa reglamentaria INPEC.', 80000, 15, 'TONFA.jpg', 'Defensa y Seguridad'),
    ('Tula Chorizo', 'Tula chorizo para transporte de dotación.', 55000, 20, 'TULA CHORIZO.jpg', 'Bolsos'),
]

def main():
    # 1. Login para obtener token
    print('Iniciando sesión...')
    r = requests.post(f'{API_URL}/api/auth/login', json={'username': USERNAME, 'password': PASSWORD})
    if r.status_code != 200:
        print(f'Error de login: {r.text}')
        return
    token = r.json()['token']
    headers = {'Authorization': f'Bearer {token}'}
    print(f'Login OK — token obtenido')

    # 2. Crear productos
    creados = 0
    errores = 0
    for nombre, desc, precio, stock, imagen, categoria in productos:
        payload = {
            'name': nombre,
            'description': desc,
            'price': precio,
            'stock': stock,
            'image_url': f'/Images/{imagen}',
            'categoria': categoria,
        }
        r = requests.post(f'{API_URL}/api/products/', json=payload, headers=headers)
        if r.status_code == 201:
            creados += 1
            print(f'  ✓ {nombre}')
        else:
            errores += 1
            print(f'  ✗ {nombre}: {r.text}')

    print(f'\nFinalizado: {creados} creados, {errores} errores')

if __name__ == '__main__':
    main()
