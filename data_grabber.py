from bs4 import BeautifulSoup
import requests
import pandas as pd

def soup_creator(url):
    r = requests.get(url)
    c = r.content
    return BeautifulSoup(c, 'html.parser')

url = 'https://www.fpc.org/adults/R_coeadultcount_runsum_salmon_results.php'

projects_dict = {
    # 'BON': 1938,
    # 'TDA': 1957,
    # 'JDA': 1968,
    # 'MCN': 1954,
    # 'IHR': 1962,
    # 'LMN': 1969,
    # 'LGS': 1970,
    'LGR': 1975
}

main_df = pd.DataFrame()

for k, v in projects_dict.items():
    print(k)
    for year in range(v, 2023):
        print('\t',year)
        params = {
            'fr_cdy': year,
            'fr_cdm': 1,
            'fr_cdd': 1,
            'to_cdm': 12,
            'to_cdd': 31,
            'prj': k
        }
        res = requests.post(url, data=params)

        soup = BeautifulSoup(res.text, 'html.parser')

        data_table = soup.find('table', {'id':'example'})

        headers_dict = {}
        thead = data_table.find('thead')
        for h, th in enumerate(thead.find_all('th')):
            headers_dict[h] = th.text

        tbody = data_table.find('tbody')
        tr_container = tbody.find_all('tr', {'class':'results'})

        try:
            td_container = tr_container[0].find_all('td')

            df = pd.DataFrame()
            d = {}
            j = 0
            for i, td in enumerate(td_container):
                if j >= 26:
                    j = 0
                    df_dict = pd.DataFrame([d])
                    df = pd.concat([df, df_dict], ignore_index=True)
                    d = {}
                
                if not headers_dict[j].startswith('Total'):
                    d[headers_dict[j]] = td.text
                    print(td.text)
                j += 1

            print(df)
            main_df = pd.concat([df, main_df], ignore_index=True)
        except:
            print('No data for year', year)
            pass

main_df.to_csv('super_output.csv', sep=',')

print('DONE')