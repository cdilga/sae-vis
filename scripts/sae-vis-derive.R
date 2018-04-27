install.packages("signal")
install.packages("pracma")

library(readr)
library(ggplot2)
library(stats)
library(signal)
library(pracma)
library(RColorBrewer)

content = readLines("C:/Users/cdilg/Google Drive/Projects/Active/SAE/SAE/1.0s Resampling/ts_16_2016-12-11_09-41-20__005.csv")
content = readLines("D:/Google Drive/Projects/Active/SAE/SAE/1.0s Resampling/ts_16_2016-12-11_09-41-20__005.csv")

dataset <- as.data.frame(read.csv(textConnection(content[-2])))
#View(dataset)
#typeof(dataset)
View(dataset[,names(dataset)[grepl("Temp", names(dataset))]])


datavis <- dataset[,c("RMS1_D2_Motor_Speed", 
                     "RMS2_D2_Motor_Speed", 
                     "RMS1_D3_Motor_Temperature", 
                     "RMS2_D3_Motor_Temperature", 
                     "RMS1_D2_Torque_Feedback",
                     "RMS2_D2_Torque_Feedback",
                     "Potentiometer_1",
                     "Potentiometer_2",
                     "Brake_1",
                     "RMS1_D3_Motor_Temperature",
                     "RMS2_D3_Motor_Temperature",
                     "RMS1_D1_Control_Board_Temperature",
                     "RMS2_D1_Control_Board_Temperature")]

derive.same.length <- function(data) {
  # Loop through everything except for the first and last
  # This will cut off the first
  retn <- c(data[1])
  for (i in c(2:length(datavis$Motor1_Velocity-1))) {
    retn[i] <- (datavis$Motor1_Velocity[i+1] - datavis$Motor1_Velocity[i-1])/2
  }
  append(retn,data[length(data)])
  return(retn)
}

derive <- function(data) {
  # Loop through everything except for the first and last
  # This will cut off the first
  retn <- c()
  for (i in c(2:length(datavis$Motor1_Velocity-1))) {
    retn[i] <- (datavis$Motor1_Velocity[i+1] - datavis$Motor1_Velocity[i-1])/2
  }
  return(retn)
}

debug.vis <- function(data) {
  qplot(c(1:length(data)), data, geom="path", main=sys.call())
}

# Wheel radius = r (units in metres)
r <- 0.3

# Gear reduction ratio
ratio <- 2.33

# Mass of the car
mass <- 86+156

datavis$ID <- 1:nrow(datavis)

datavis$Motor1_Velocity <- (dataset$RMS1_D2_Motor_Speed*2*pi*r)/(ratio*60)
datavis$Motor2_Velocity <- (dataset$RMS2_D2_Motor_Speed*2*pi*r)/(ratio*60)

smooth.loess <- function(vec, index) {
  return(
    predict(loess(vec ~ index, span=0.1))
  )
}



# datavis$Motor1_Velocity_Smooth <- predict(smooth.spline(datavis$Motor1_Velocity))$y
datavis$Motor1_Velocity_Smooth_Loess <- smooth.loess(datavis$Motor1_Velocity, datavis$ID)
datavis$Motor2_Velocity_Smooth_Loess <- smooth.loess(datavis$Motor2_Velocity, datavis$ID)
datavis$Motor1_Velocity_Smooth <- savgol(datavis$Motor1_Velocity, 151, dorder=0)
datavis$Motor2_Velocity_Smooth <- savgol(datavis$Motor2_Velocity, 151, dorder=0)

datavis$Motor1_Acceleration <- savgol(datavis$Motor1_Velocity, 151, dorder=1)
datavis$Motor2_Acceleration <- savgol(datavis$Motor2_Velocity, 151, dorder=1)

?mean

datavis$Velocity <- (datavis$Motor1_Velocity_Smooth - datavis$Motor2_Velocity_Smooth) / 2
debug.vis(datavis$Velocity)

datavis$Acceleration <- (datavis$Motor1_Acceleration - datavis$Motor2_Acceleration) / 2
debug.vis(datavis$Acceleration)
debug.vis(datavis$Motor1_Acceleration)

datavis$Motor_Velocity_Difference <- datavis$Motor1_Velocity_Smooth+datavis$Motor2_Velocity_Smooth


difference <- ggplot(data=datavis[c(1:(nrow(datavis)-50)),], aes(x=ID, y=Motor_Velocity_Difference, abs(Acceleration)))
difference + geom_line(aes(color=abs(Acceleration))) +
  scale_color_gradient(low="green", high="red") +
  xlab("Time (s)") +
  ylab("Velocity (ms^-1) difference between Motor 1 and 2") +
  ggtitle("Electronic differential of 2016 Car") +
  theme_bw()

?scale_color_gradient
?ggplot

# Look at the outliers for acceleration (which we see at the end of the data)
outlier.acceleration <- ggplot(data=datavis, aes(x=ID, y=Acceleration)) 
outlier.acceleration + geom_line()

# Instead Try a Savitzky-Golay fit
?sgolayfilt()
sg.acceleration <- sgolayfilt(datavis$Motor1_Velocity, p=3, n=151, m=1)
sg.smooth.velocity <- savgol(datavis$Motor1_Velocity, 151, dorder=0)

# https://www.rdocumentation.org/packages/pracma/versions/1.9.9/topics/savgol

smooth.acceleration <- savgol(datavis$Motor1_Velocity, 151, dorder=1)
debug.vis(sg.acceleration)
debug.vis(smooth.acceleration)
acceleration <- derive(smooth.velocity)
debug.vis(acceleration)



