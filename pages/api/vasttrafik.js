const API_KEY = 'fe53cf5a-20ff-4715-bcb7-c74d95da3225';
const STOP_ID = '740025668'; 

const TARGET_STOP_NAME = "Göteborg Brunnsparken"; 

export default async function handler(req, res) {
  try {

    const url = `https://api.resrobot.se/v2.1/departureBoard?id=${STOP_ID}&format=json&accessId=${API_KEY}&passlist=1`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.Departure) {
      return res.status(200).json({ departures: [] });
    }

    const departures = data.Departure.map(d => {

      const targetStop = d.Stops?.Stop?.find(s => s.name.includes(TARGET_STOP_NAME));

      let arrivalAtTarget = null;
      if (targetStop) {

        arrivalAtTarget = `${targetStop.arrDate}T${targetStop.rtArrTime || targetStop.arrTime}`;
      }

      return {
        line: d.ProductAtStop.displayNumber,
        dest: d.direction,
        time: `${d.date}T${d.rtTime || d.time}`, 
        arrivalTimeAtTarget: arrivalAtTarget, 

      };
    });

    res.status(200).json({ departures });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
}