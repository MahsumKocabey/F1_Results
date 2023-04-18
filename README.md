# F1_Results
Web app Live: https://mahsumkocabey.github.io/F1_Results/

<h3>Data Processing</h3>
The dataset used in this visualisation is, given by the lecturer, called "Formula 1 World Championship from 1950 to 2023", which could also be found on
Kaggle: https://www.kaggle.com/datasets/rohanrao/formula-1-world-championship-1950-2020 .
<br></br>
The dataset consists of multiple CSV files, where each CSV file contains primary and foreign keys. The data was merged and processed by using Python scripts to create the visualisation. If interested, the script can be found in Figure 1 in the Appendix C of the report. The merged files consist of: results, drivers, constructors, races and the lapTimes.csv files. After merging the files, only some specific columns chosen from the whole dataset. It was not necessary to do much of data manipulation apart from changing column names. The data had some missing values, as expected, since some races could not be completed due to casualties, or some errors. This is also visualised to show if a driver at a particular race failed to complete the race.
<br></br>
Lastly, the merged csv file exported as "driver_positions_per_lap" and imported into the code to fit the multi-line chart using D3.js.
