const axios = require('axios');
const Product = require('../models/Product');

const getWeatherRecommendations = async (lat, lon) => {
  try {
    // 1. Get current weather from OpenWeather API
    const weatherResponse = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
    );
    
    const weatherCondition = weatherResponse.data.weather[0].main.toLowerCase();
    const temperature = weatherResponse.data.main.temp;

    // 2. Get matching products from database
    const dbProducts = await Product.find({ weatherTags: weatherCondition });

    // 3. Define external recommendations based on weather
    const externalRecommendations = {
      rainy: [
        {
          id: 'ext-umbrella',
          name: 'Premium Umbrella (Partner)',
          price: 29.99,
          source: 'RainyDays.com',
          link: 'https://rainydays.com/umbrellas'
        }
      ],
      sunny: [
        {
          id: 'ext-sunscreen',
          name: 'SPF 50 Sunscreen (Partner)',
          price: 15.99,
          source: 'SunProtection.com',
          link: 'https://sunprotection.com/spf50'
        }
      ],

    };

    return {
      weather: {
        condition: weatherCondition,
        temperature,
        description: weatherResponse.data.weather[0].description
      },
      dbProducts,
      externalProducts: externalRecommendations[weatherCondition] || []
    };

  } catch (error) {
    console.error('Weather API error:', error);
    throw new Error('Failed to get weather recommendations');
  }
};

module.exports = { getWeatherRecommendations };