import openai
import requests
import os
import re
import urllib.request
from bs4 import BeautifulSoup
import requests
import uvicorn
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
import json
from fastapi.middleware.cors import CORSMiddleware


#initial testing
#test values
# country = 'France'
# duration_weeks = 2
# max_destinations = 3
# budget = 6000
#interests = 'eat food and go sightseeing'
openai.organization = 'org-p0C1bwVzqYbYtNqNoFUDaDoV'
openai.api_key = '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'

def get_gpt_output(gpt_prompt):
  message=[{'role': 'user', 'content': gpt_prompt}]
  response = openai.ChatCompletion.create(
    model='gpt-4',
    messages = message,
    temperature=0.2,
    max_tokens=700,
    frequency_penalty=0.0
  )
  return response

def find_gps_coords(itinerary_dict, country):
  cities = list(itinerary_dict.keys())
  for i in range(len(cities)):
    accommodations = itinerary_dict[cities[i]][0]['accommodations']
    gpt_output = get_gpt_output(f'what are the coordinates of the {accommodations} in {cities[i]}, {country}? Give an answer that only contains decimal numbers (no indication of N or E and no extra words)')
    gpt_response = gpt_output['choices'][0]['message']['content']
    itinerary_dict[cities[i]][0]['accommodations'] = [accommodations, gpt_response]

    activities = itinerary_dict[cities[i]][0]['activities']
    for j in range(len(activities)):
      gpt_output = get_gpt_output(f'what are the coordinates of the {activities[j]} in {cities[i]}, {country}? Give an answer that only contains decimal numbers (no indication of N or E and no extra words)')
      gpt_response = gpt_output['choices'][0]['message']['content']
      itinerary_dict[cities[i]][0]['activities'][j] = [activities[j], gpt_response]

  return itinerary_dict

def get_images(coordinates_dict, country):
  img_dict = coordinates_dict
  cities = list(img_dict.keys())

  for i in range(len(cities)):
    city = cities[i]
    city = city.replace(' ', '+')
    accommodations = img_dict[cities[i]][0]['accommodations'][0]
    accommodations = accommodations.replace(' ', '+')
    query = f'{accommodations}+in+{city}+{country}'

    html_page = requests.get(f'https://www.google.com/search?q={query}&hl=en&tbm=isch&sxsrf=APq-WBvwYw7CNUiZc6PrdsAMkiCgIOVE1A%3A1647140742473&source=hp&biw=1280&bih=648&ei=hl8tYsyIGvWoqtsPo4Oa2AI&iflsig=AHkkrS4AAAAAYi1tlmv_zjSF4doH-hSjrDhlVjtmsHbm&ved=0ahUKEwjM4-O2jcL2AhV1lGoFHaOBBisQ4dUDCAc&uact=5&oq={query}&gs_lcp=CgNpbWcQAzIHCCMQ7wMQJzIICAAQgAQQsQMyCAgAEIAEELEDMggIABCABBCxAzIICAAQgAQQsQMyCAgAEIAEELEDMggIABCABBCxAzIICAAQgAQQsQMyCAgAEIAEELEDMggIABCABBCxAzoFCAAQgAQ6CAgAELEDEIMBOgsIABCABBCxAxCDAVAAWO8OYIkSaABwAHgAgAFjiAGgB5IBAjEwmAEAoAEBqgELZ3dzLXdpei1pbWc&sclient=img')
    soup = BeautifulSoup(html_page.content, 'html.parser')
    url = soup.find_all('img')[2]['src']

    img_dict[cities[i]][0]['accommodations'].append(url)

    activities = img_dict[cities[i]][0]['activities']
    for j in range(len(activities)):
      activity = activities[j][0]
      activity = activity.replace(' ', '+')
      query = f'{activity}+in+{city}+{country}'

      html_page = requests.get(f'https://www.google.com/search?q={query}&hl=en&tbm=isch&sxsrf=APq-WBvwYw7CNUiZc6PrdsAMkiCgIOVE1A%3A1647140742473&source=hp&biw=1280&bih=648&ei=hl8tYsyIGvWoqtsPo4Oa2AI&iflsig=AHkkrS4AAAAAYi1tlmv_zjSF4doH-hSjrDhlVjtmsHbm&ved=0ahUKEwjM4-O2jcL2AhV1lGoFHaOBBisQ4dUDCAc&uact=5&oq={query}&gs_lcp=CgNpbWcQAzIHCCMQ7wMQJzIICAAQgAQQsQMyCAgAEIAEELEDMggIABCABBCxAzIICAAQgAQQsQMyCAgAEIAEELEDMggIABCABBCxAzIICAAQgAQQsQMyCAgAEIAEELEDMggIABCABBCxAzoFCAAQgAQ6CAgAELEDEIMBOgsIABCABBCxAxCDAVAAWO8OYIkSaABwAHgAgAFjiAGgB5IBAjEwmAEAoAEBqgELZ3dzLXdpei1pbWc&sclient=img')
      soup = BeautifulSoup(html_page.content, 'html.parser')
      url = soup.find_all('img')[2]['src']

      img_dict[cities[i]][0]['activities'][j].append(url)

  return img_dict

def get_itinerary(res, country):
  travel_country = country
  index_list = [0]
  for i in re.finditer('\n', res):
    index_list.append(i.end())
  index_list.append(len(res))

  res_dict = {}

  cities_list = []
  accommodations_list = []
  activities_list = []
  number_list = []

  for i in range(len(index_list) - 1):
    substr = ''
    for j in range(index_list[i], index_list[i + 1]):
      substr = substr + res[j]
    substr = substr.split('\n')
    substr = substr[0].split(', ')
    if(len(substr) > 1):
      cities_list.append(substr[0])
      accommodations_list.append(substr[1])
      activities_list.append(substr[2:5])
      number_list.append(substr[-1])

  for i in range(len(cities_list)):
    res_dict[cities_list[i]] = [{'accommodations': accommodations_list[i], 'number of days': number_list[i], 'activities': activities_list[i]}]

  full_itinerary = find_gps_coords(res_dict, travel_country)
  final_dict = get_images(full_itinerary, travel_country)
  return final_dict


# gpt_output = get_gpt_output('how would i enter multiple inputs into a fastapi get function (in this particular example, im trying to create an api which takes inputs such as a country one would like to visit, duration of that persons stay, and that persons budget to return a dictionary with a travel plan. please write all code in python')
# print(gpt_output['choices'][0]['message']['content'])

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

@app.get('/trip')
def itinerary(country: str, duration: int, max_destinations: int, budget: int, interests: str):
  # answers = json.loads(answers.json())
  # query_list = parse_data(answers)
  gpt_output = get_gpt_output(f'Plan a vacation for me in {country} with a duration of {duration} weeks, a budget of {budget} dollars, and a maximum of {max_destinations} destinations. On this trip, I would like to {interests}. Give a list of cities I can visit and provide accommodations for each city and activities to do in each city. The format should look like this: city name, accommodations, exactly 3 activities, number of days spent in the city \n city name, accommodations, exactly 3 activities, number of days spent in the city \n and so on. Dont add any additional words, phrases, or descriptions such as "the," "Visit," "take a tour of," or "explore" anywhere in the result')
  gpt_response = gpt_output['choices'][0]['message']['content']
  itinerary_dict = get_itinerary(gpt_response, country)

  return {'itinerary': itinerary_dict}

uvicorn.run(app, port=8000)