# Reference reconstruction of the Jangseung experiment (Wolf, Gamboa, and Borowczak, IEEE ISC2 2021)
# for /papers/jangseung-poisoning/. scikit-learn defaults; see the page's researcher notes.
# pre.py imports this module and writes the page's precomputed figures (jangseung-data.json).
import numpy as np, gzip, sys, warnings, json, time
warnings.filterwarnings('ignore')
from sklearn.svm import SVC
from sklearn.ensemble import IsolationForest
from sklearn.covariance import EllipticEnvelope
D='data/'  # folder holding the four MNIST .gz files
def idx(f,off): return np.frombuffer(gzip.open(D+f).read(),np.uint8,offset=off)
def mnist():
    Xtr=idx('train-images-idx3-ubyte.gz',16).reshape(-1,784).astype(float); ytr=idx('train-labels-idx1-ubyte.gz',8)
    return Xtr,ytr
def adv_point(model,x,lab,t=1e-3,eps=1e-5,cap=10):
    # Algorithm 1: gradient ascent on hinge loss of (x,lab) under current model, unit-vector steps of t
    sv=model.support_vectors_; a=model.dual_coef_[0]; g=model._gamma
    def f(z): return a@np.exp(-g*((sv-z)**2).sum(1))+model.intercept_[0]
    def loss(z): return max(0,1-lab*f(z))
    x=x.copy(); l0=loss(x)
    for _ in range(cap):
        k=np.exp(-g*((sv-x)**2).sum(1)); grad_f=(a*k)@(-2*g*(x-sv))
        G=-lab*grad_f; n=np.linalg.norm(G)
        if n==0: break
        x=x+G/n*t; l1=loss(x)
        if l1-eps<l0: break
        l0=l1
    return x
def run(Xtr,ytr,Xte,yte,NA,rng,det='if'):
    pos=Xtr[ytr==1]; neg=Xtr[ytr==-1]
    mk=lambda M: (IsolationForest(random_state=int(rng.integers(1<<30))) if det=='if' else EllipticEnvelope(random_state=int(rng.integers(1<<30)))).fit(M)
    ADp,ADn=mk(pos),mk(neg)
    Tg,Lg=[Xtr],[ytr]; Tu,Lu=[Xtr],[ytr]
    mg=SVC().fit(Xtr,ytr); mu=mg
    acce=[mg.score(Xte,yte)]; accu=[acce[0]]; allowed=0
    for i in range(NA):
        j=rng.integers(len(Xtr)); xi,li=Xtr[j],ytr[j]
        ap=adv_point(mu,xi,-li); al=-li
        Tu.append(ap[None]); Lu.append([al])
        p=(ADp if li==-1 else ADn).predict(ap[None])[0]
        if p==1: Tg.append(ap[None]); Lg.append([al]); allowed+=1
        mu=SVC().fit(np.vstack(Tu),np.concatenate(Lu)); mg=SVC().fit(np.vstack(Tg),np.concatenate(Lg))
        acce.append(mg.score(Xte,yte)); accu.append(mu.score(Xte,yte))
    return dict(acce=acce,accu=accu,allowed=allowed)
if __name__=='__main__':
    X,Y=mnist(); rng=np.random.default_rng(int(sys.argv[3]))
    d1,d2=int(sys.argv[1]),int(sys.argv[2]); ntr=int(sys.argv[4])
    i1=rng.permutation(np.where(Y==d1)[0]); i2=rng.permutation(np.where(Y==d2)[0])
    h=ntr//2
    tr=np.concatenate([i1[:h],i2[:h]]); te=np.concatenate([i1[h:h+125],i2[h:h+125]])
    y=lambda ii: np.where(Y[ii]==d1,1,-1)
    t=time.time(); r=run(X[tr],y(tr),X[te],y(te),100,rng)
    print(d1,d2,ntr,'avg_u %.3f avg_g %.3f last_u %.3f last_g %.3f defended %d%% t=%.0fs'%(np.mean(r['accu']),np.mean(r['acce']),r['accu'][-1],r['acce'][-1],100-r['allowed'],time.time()-t))
