import random
import heapq
import time

def totorandom_number():
    
    a=['cda','fed', 'jih', 'mnk']
    for i in range(len(a)):
        a[i]="".join(sorted(a[i]))
    print(a[0][0])
    
totorandom_number()  # BAD SET