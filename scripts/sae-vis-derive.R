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

derive <- function(data) {
  # Loop through everything except for the first and last
  # This will cut off the first
  retn <- c()
  for (i in c(2:length(datavis$Motor1_Velocity-1))) {
    retn[i] <- (datavis$Motor1_Velocity[i+1] - datavis$Motor1_Velocity[i-1])/2
  }
  return(retn)
}

debug.vis <- function(data, interval = c(120, 180)) {
  qplot(c(1:length(data)), data, geom="path")
}

# Wheel radius = r (units in metres)
r <- 0.3

# Gear reduction ratio
ratio <- 2.33

# Mass of the car
mass <- 86+156

datavis["Motor1_Velocity"] <- (dataset["RMS1_D2_Motor_Speed"]*2*pi*r)/(ratio*60)
datavis["Motor2_Velocity"] <- (dataset["RMS2_D2_Motor_Speed"]*2*pi*r)/(ratio*60)

velocityvec1 <- datavis$Motor1_Velocity
velocityvec2 <- datavis$Motor2_Velocity

velocity <- predict(smooth.spline(datavis$Motor1_Velocity))$y
velocity.loess <- loess.smooth(
  c(1:length(datavis$Motor1_Velocity)),
  datavis$Motor1_Velocity, evaluation=length(datavis$Motor1_Velocity))$y

?loess.smooth()
?loess.smooth
datavis$Motor1_Velocity
length(datavis$Motor1_Velocity)
length(velocityvec1)
length(velocity.loess)
length(acceleration1.loess)

acceleration1.loess <- loess.smooth(
  c(1:length(derive(velocity.loess))),
  derive(velocity.loess), evaluate=length(derive(velocity.loess)))$y

head(velocity.loess$y)

debug.vis(velocity.loess)
?predict

debug.vis(velocity)
derived <- derive(velocity)
head(velocity)
head(derived)
somevar <- predict.loess()
debug.vis(derive(velocity))
accel <- derive(velocity)
acceleration1 <- derive(velocityvec1)

?smooth.spline

head(acceleration1)

debug.vis(velocityvec1)
debug.vis(velocityvec2)
debug.vis(rpmvec1)
debug.vis(rpmvec2)
debug.vis(acceleration1)
debug.vis(acceleration2)

debug.vis(velocity.loess)
debug.vis(acceleration1.loess, c(1, 500))
