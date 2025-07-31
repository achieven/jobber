#include <iostream>
#include <cstdlib>
#include <random>

int getRandomDecision() {
    std::random_device rd;
    std::mt19937 generator(rd());
    std::uniform_int_distribution<> distrib(0, 1);
    return distrib(generator)
}

int main() {
    int random_decision = getRandomDecision()

    std::cout << "C++ program exiting with success code " << random_decision << std::endl;
    std::exit(random_decision);
    return 0; 
}

