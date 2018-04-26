library(readr)
library(ggplot2)
library(stats)
content = readLines("C:/Users/cdilg/Google Drive/Projects/Active/SAE/SAE/1.0s Resampling/ts_16_2016-12-11_09-41-20__005.csv")
content = readLines("D:/Google Drive/Projects/Active/SAE/SAE/1.0s Resampling/ts_16_2016-12-11_09-41-20__005.csv")

dataset <- as.data.frame(read.csv(textConnection(content[-2])))
View(dataset)
typeof(dataset)

datavis <- dataset[c("RMS1_D2_Motor_Speed", 
                     "RMS2_D2_Motor_Speed", 
                     "RMS1_D3_Motor_Temperature", 
                     "RMS2_D3_Motor_Temperature", 
                     "RMS1_D2_Torque_Feedback",
                     "RMS2_D2_Torque_Feedback",
                     "Potentiometer_1",
                     "Potentiometer_2",
                     "Brake_1" )]

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

smoothVec <- function(vec, index) {
  return(
    predict(loess(vec ~ index, span=0.1))
  )
}

# datavis$Motor1_Velocity_Smooth <- predict(smooth.spline(datavis$Motor1_Velocity))$y
datavis$Motor1_Velocity_Smooth <- smoothVec(datavis$Motor1_Velocity, datavis$ID)
datavis$Motor2_Velocity_Smooth <- smoothVec(datavis$Motor2_Velocity, datavis$ID)

# There are numbers here
datavis$Motor1_Velocity - datavis$Motor1_Velocity_Smooth

# Why?
derive(datavis$Motor1_Velocity) - derive(datavis$Motor1_Velocity_Smooth)

# However
head(derive(datavis$Motor1_Velocity))
head(derive(datavis$Motor1_Velocity_Smooth))

# This is absurd because
head(datavis$Motor1_Velocity)
head(datavis$Motor1_Velocity_Smooth)


datavis$Motor1_Acceleration <- derive(datavis$Motor1_Velocity_Smooth)
datavis$Motor2_Acceleration <- derive(datavis$Motor2_Velocity_Smooth)

# Here is a graph of the noise being removed
debug.vis(datavis$Motor1_Velocity - datavis$Motor1_Velocity_Smooth)

#This shouldn't be a flat line.
debug.vis(datavis$Motor1_Acceleration - derive(datavis$Motor1_Velocity))

datavis$Motor1_Acceleration_Smooth <- smoothVec(datavis$Motor1_Acceleration, datavis$ID)
datavis$Motor2_Acceleration_Smooth <- smoothVec(datavis$Motor2_Acceleration, datavis$ID)

debug.vis(datavis$Motor1_Velocity_Smooth)
